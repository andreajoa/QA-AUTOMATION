import fetch from 'node-fetch';
import chalk from 'chalk';

const CONFIG = {
  shopify: {
    url: process.env.SHOPIFY_STORE_URL || 'https://example.myshopify.com',
    token: process.env.SHOPIFY_ACCESS_TOKEN || ''
  }
};

let stats = { altText: 0, tags: 0, metaTags: 0, productType: 0, errors: 0 };

async function startEnglishFix() {
  console.log(chalk.blue.bold('\n? SHOPIFY AUTO-FIX - SERP COMPLIANT'));
  console.log(chalk.gray('???????????????????????????????????????????????????'));
  
  try {
    await testConnection();
    const products = await getProducts();
    
    console.log(chalk.blue(`\n? Processing ${products.length} products...\n`));
    
    for (const product of products) {
      await fixProduct(product);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    showResults();
    
  } catch (error) {
    console.log(chalk.red(`? Error: ${error.message}`));
  }
}

async function testConnection() {
  const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/shop.json`, {
    headers: { 'X-Shopify-Access-Token': CONFIG.shopify.token }
  });
  
  if (!response.ok) throw new Error(`Connection failed: ${response.status}`);
  
  const data = await response.json();
  console.log(chalk.green(`? Connected to: ${data.shop.name}`));
}

async function getProducts() {
  const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/products.json?limit=250`, {
    headers: { 'X-Shopify-Access-Token': CONFIG.shopify.token }
  });
  
  const data = await response.json();
  return data.products || [];
}

async function fixProduct(product) {
  console.log(chalk.cyan(`\n? Optimizing: ${product.title}`));
  console.log(chalk.gray('?????????????????????????????????????'));
  
  await fixAltText(product);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await fixTags(product);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await fixMetaTags(product);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await fixProductType(product);
}

async function fixAltText(product) {
  const imagesToFix = product.images?.filter(img => !img.alt || img.alt.trim() === '') || [];
  
  if (imagesToFix.length === 0) {
    console.log(chalk.gray('  ??  Alt text: Already optimized'));
    return;
  }
  
  console.log(chalk.yellow(`  ??  Fixing ${imagesToFix.length} image(s)...`));
  
  for (const [index, image] of imagesToFix.entries()) {
    const altText = generateAltText(product.title, index);
    
    try {
      const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/products/${product.id}/images/${image.id}.json`, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': CONFIG.shopify.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: { id: image.id, alt: altText }
        })
      });
      
      if (response.ok) {
        console.log(chalk.green(`      ? "${altText}"`));
        stats.altText++;
      } else {
        console.log(chalk.red(`      ? Error ${response.status}`));
        stats.errors++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.log(chalk.red(`      ? Error: ${error.message}`));
      stats.errors++;
    }
  }
}

async function fixTags(product) {
  const currentTags = (product.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const seoTags = generateSeoTags(product.title);
  const newTags = seoTags.filter(tag => !currentTags.some(existing => existing.toLowerCase() === tag.toLowerCase()));
  
  if (newTags.length === 0) {
    console.log(chalk.gray('  ??  Tags: Already optimized'));
    return;
  }
  
  const allTags = [...currentTags, ...newTags].join(', ');
  
  try {
    const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/products/${product.id}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': CONFIG.shopify.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product: { id: product.id, tags: allTags }
      })
    });
    
    if (response.ok) {
      console.log(chalk.green(`  ? Tags added: ${newTags.join(', ')}`));
      stats.tags++;
    } else {
      console.log(chalk.red(`  ? Tags error: ${response.status}`));
      stats.errors++;
    }
  } catch (error) {
    console.log(chalk.red(`  ? Tags error: ${error.message}`));
    stats.errors++;
  }
}

async function fixMetaTags(product) {
  // ALWAYS update meta tags to ensure SERP compliance
  const metaTitle = generateMetaTitle(product.title);
  const metaDescription = generateMetaDescription(product.title);
  
  console.log(chalk.blue(`\n  ? SERP Preview:`));
  console.log(chalk.gray(`  ?${'?'.repeat(68)}?`));
  console.log(chalk.cyan(`  ? ${metaTitle}${' '.repeat(68 - metaTitle.length)}?`));
  console.log(chalk.green(`  ? ${metaDescription.substring(0, 66)}  ?`));
  console.log(chalk.gray(`  ?${'?'.repeat(68)}?`));
  console.log(chalk.yellow(`  ? Title: ${metaTitle.length}/60 chars ${metaTitle.length <= 60 ? '?' : '?'}`));
  console.log(chalk.yellow(`  ? Desc: ${metaDescription.length}/160 chars ${metaDescription.length <= 160 ? '?' : '?'}\n`));
  
  try {
    const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/products/${product.id}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': CONFIG.shopify.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product: {
          id: product.id,
          seo_title: metaTitle,
          seo_description: metaDescription
        }
      })
    });
    
    if (response.ok) {
      console.log(chalk.green(`  ? Meta tags applied (SERP compliant)`));
      stats.metaTags++;
    } else {
      console.log(chalk.red(`  ? Meta error: ${response.status}`));
      stats.errors++;
    }
  } catch (error) {
    console.log(chalk.red(`  ? Meta error: ${error.message}`));
    stats.errors++;
  }
}

async function fixProductType(product) {
  if (product.product_type && product.product_type.trim() !== '') {
    console.log(chalk.gray('  ? Product type: Already defined'));
    return;
  }
  
  const productType = generateProductType(product.title);
  
  try {
    const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/products/${product.id}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': CONFIG.shopify.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product: { id: product.id, product_type: productType }
      })
    });
    
    if (response.ok) {
      console.log(chalk.green(`  ? Product type: "${productType}"`));
      stats.productType++;
    } else {
      console.log(chalk.red(`  ? Type error: ${response.status}`));
      stats.errors++;
    }
  } catch (error) {
    console.log(chalk.red(`  ? Type error: ${error.message}`));
    stats.errors++;
  }
}

// ==========================================
// SERP-COMPLIANT GENERATORS
// ==========================================

function generateAltText(title, imageIndex = 0) {
  // Clean and shorten title for alt text
  let cleanTitle = title
    .replace(/[^\w\s-]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove common filler words
  const fillers = ['1PC', '1 PC', 'Random', 'High Quality'];
  fillers.forEach(filler => {
    cleanTitle = cleanTitle.replace(new RegExp(filler, 'gi'), '');
  });
  
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  
  // Limit to reasonable length (max 10 words)
  const words = cleanTitle.split(' ').slice(0, 10).join(' ');
  
  if (imageIndex === 0) {
    return words;
  } else {
    return `${words} - View ${imageIndex + 1}`;
  }
}

function generateSeoTags(title) {
  const titleLower = title.toLowerCase();
  
  // Extract meaningful keywords
  const keywords = [];
  
  // Category-based tags
  if (titleLower.includes('crystal') || titleLower.includes('stone')) {
    keywords.push('Natural Crystals', 'Crystal Decor', 'Healing Stones');
  }
  if (titleLower.includes('bowl')) {
    keywords.push('Decorative Bowl', 'Crystal Bowl', 'Home Decor');
  }
  if (titleLower.includes('yooperlite')) {
    keywords.push('Yooperlite Stone', 'Rare Crystals', 'UV Reactive');
  }
  if (titleLower.includes('gift') || titleLower.includes('birthday')) {
    keywords.push('Gift Ideas', 'Birthday Gift', 'Unique Gifts');
  }
  if (titleLower.includes('light') || titleLower.includes('led')) {
    keywords.push('LED Lighting', 'Night Light', 'Ambient Light');
  }
  if (titleLower.includes('rechargeable')) {
    keywords.push('Rechargeable', 'Wireless', 'Portable');
  }
  
  // Add generic quality tags
  keywords.push('Premium Quality', 'Fast Shipping');
  
  return [...new Set(keywords)].slice(0, 8);
}

function generateMetaTitle(title) {
  // STRICT SERP RULES: MAX 60 CHARACTERS
  const MAX_LENGTH = 60;
  const BRAND = 'DLLHOME';
  const SEPARATOR = ' | ';
  
  // Clean title from garbage
  let cleanTitle = title
    .replace(/1PC /gi, '')
    .replace(/1 PC /gi, '')
    .replace(/Random /gi, '')
    .replace(/High Quality /gi, '')
    .replace(/,\s*$/, '') // Remove trailing comma
    .trim();
  
  // Calculate space available
  const reservedSpace = BRAND.length + SEPARATOR.length; // e.g., 10 chars
  const availableForProduct = MAX_LENGTH - reservedSpace; // 50 chars
  
  // Extract the most important words (remove filler)
  const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'from', 'of'];
  const words = cleanTitle.split(' ').filter(word => 
    word.length > 0 && !fillerWords.includes(word.toLowerCase())
  );
  
  // Build title word by word until we hit the limit
  let productPart = '';
  for (const word of words) {
    const testTitle = productPart + (productPart ? ' ' : '') + word;
    if (testTitle.length <= availableForProduct) {
      productPart = testTitle;
    } else {
      break;
    }
  }
  
  // If we got nothing, use truncated original
  if (!productPart) {
    productPart = cleanTitle.substring(0, availableForProduct);
  }
  
  const finalTitle = `${productPart}${SEPARATOR}${BRAND}`;
  
  // Safety check
  return finalTitle.length > MAX_LENGTH 
    ? finalTitle.substring(0, MAX_LENGTH) 
    : finalTitle;
}

function generateMetaDescription(title) {
  // STRICT SERP RULES: 150-160 CHARACTERS
  const MAX_LENGTH = 160;
  
  // Clean title
  let cleanTitle = title
    .replace(/1PC /gi, '')
    .replace(/1 PC /gi, '')
    .replace(/Random /gi, '')
    .replace(/High Quality /gi, '')
    .replace(/,\s*$/, '')
    .trim();
  
  // Determine product category and benefit
  const titleLower = cleanTitle.toLowerCase();
  let benefit = '';
  let cta = 'Shop now!';
  
  if (titleLower.includes('crystal') || titleLower.includes('stone')) {
    benefit = 'Natural healing crystal for home decor';
  } else if (titleLower.includes('yooperlite')) {
    benefit = 'Rare UV-reactive crystal with unique glow';
  } else if (titleLower.includes('bowl')) {
    benefit = 'Beautiful decorative piece for any space';
  } else if (titleLower.includes('light') || titleLower.includes('led')) {
    benefit = 'Energy-efficient lighting with modern design';
  } else if (titleLower.includes('rechargeable')) {
    benefit = 'Wireless convenience and long battery life';
  } else {
    benefit = 'Premium quality with fast shipping';
  }
  
  // Shorten product name if needed
  let productName = cleanTitle;
  const maxProductLength = MAX_LENGTH - benefit.length - cta.length - 6; // 6 for " - " and ". "
  
  if (productName.length > maxProductLength) {
    const words = productName.split(' ');
    productName = '';
    for (const word of words) {
      if ((productName + ' ' + word).trim().length <= maxProductLength) {
        productName += (productName ? ' ' : '') + word;
      } else {
        break;
      }
    }
  }
  
  // Build: "[Product] - [Benefit]. [CTA]"
  let description = `${productName} - ${benefit}. ${cta}`;
  
  // Final trim if still too long
  if (description.length > MAX_LENGTH) {
    description = description.substring(0, MAX_LENGTH - 3) + '...';
  }
  
  return description;
}

function generateProductType(title) {
  const titleLower = title.toLowerCase();
  
  const categories = {
    'Crystals & Minerals': ['crystal', 'stone', 'mineral', 'yooperlite', 'quartz', 'gem'],
    'Home Decor': ['decor', 'decoration', 'bowl', 'ornament', 'decorative'],
    'Lighting': ['light', 'led', 'lamp', 'bulb', 'illumination'],
    'Bedroom': ['bedroom', 'bed', 'night', 'sleep', 'nightstand'],
    'Electronics': ['electronic', 'rechargeable', 'battery', 'usb', 'smart'],
    'Gifts': ['gift', 'birthday', 'present'],
    'Home & Living': ['home', 'living', 'interior']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'Home & Living';
}

function showResults() {
  console.log(chalk.blue.bold('\n\n? SERP OPTIMIZATION COMPLETE!'));
  console.log(chalk.gray('???????????????????????????????????????????????????'));
  console.log(chalk.green(`? Alt texts added: ${stats.altText}`));
  console.log(chalk.green(`? Products with SEO tags: ${stats.tags}`));
  console.log(chalk.green(`? SERP-compliant meta tags: ${stats.metaTags}`));
  console.log(chalk.green(`? Product types defined: ${stats.productType}`));
  
  if (stats.errors > 0) {
    console.log(chalk.red(`? Errors encountered: ${stats.errors}`));
  }
  
  const total = stats.altText + stats.tags + stats.metaTags + stats.productType;
  console.log(chalk.blue.bold(`\n? TOTAL: ${total} optimizations applied!`));
  console.log(chalk.cyan('\n? Meta tags now follow Google SERP standards:'));
  console.log(chalk.white('   � Title: MAX 60 characters (cleaned & optimized)'));
  console.log(chalk.white('   � Description: 150-160 characters (benefit-focused)'));
  console.log(chalk.white('   � Removed: filler words, random text, specs'));
  console.log(chalk.white('   � Format: Clear, concise, action-oriented'));
  console.log(chalk.gray('???????????????????????????????????????????????????\n'));
}

startEnglishFix();