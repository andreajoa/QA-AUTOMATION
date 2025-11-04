import fetch from 'node-fetch';
import chalk from 'chalk';

const CONFIG = {
  url: process.env.SHOPIFY_STORE_URL || 'https://example.myshopify.com',
  token: process.env.SHOPIFY_ACCESS_TOKEN || ''
};

async function forceFixMeta() {
  console.log(chalk.blue.bold('\n? FORCE FIXING META TAGS'));
  console.log(chalk.gray('???????????????????????????????????????????????????\n'));
  
  try {
    // Get products
    const response = await fetch(`${CONFIG.url}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': CONFIG.token }
    });
    
    const data = await response.json();
    console.log(chalk.cyan(`? Found ${data.products.length} products\n`));
    
    for (const product of data.products) {
      console.log(chalk.yellow(`\n? Processing: ${product.title.substring(0, 50)}...`));
      
      // Generate optimized meta tags
      const metaTitle = generateMetaTitle(product.title);
      const metaDescription = generateMetaDescription(product.title);
      
      console.log(chalk.blue('\n? Generated Meta Tags:'));
      console.log(chalk.white(`Title (${metaTitle.length}/60):`), metaTitle);
      console.log(chalk.white(`Desc (${metaDescription.length}/160):`), metaDescription);
      
      // Apply update
      console.log(chalk.yellow('\n? Applying to Shopify...'));
      
      const updateResponse = await fetch(`${CONFIG.url}/admin/api/2023-10/products/${product.id}.json`, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': CONFIG.token,
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
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.text();
        console.log(chalk.red(`? Update failed: ${updateResponse.status}`));
        console.log(chalk.red(`Error: ${errorData}`));
        continue;
      }
      
      console.log(chalk.green('? Update sent successfully'));
      
      // VERIFY - Check if it was really applied
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(chalk.blue('\n? Verifying update...'));
      
      const verifyResponse = await fetch(`${CONFIG.url}/admin/api/2023-10/products/${product.id}.json`, {
        headers: { 'X-Shopify-Access-Token': CONFIG.token }
      });
      
      const verifyData = await verifyResponse.json();
      const updated = verifyData.product;
      
      console.log(chalk.cyan('\n? Current values in Shopify:'));
      console.log(chalk.white('Meta Title:'), updated.seo_title || chalk.red('STILL NOT SET'));
      console.log(chalk.white('Meta Desc:'), updated.seo_description || chalk.red('STILL NOT SET'));
      
      if (updated.seo_title === metaTitle && updated.seo_description === metaDescription) {
        console.log(chalk.green('\n? VERIFIED: Meta tags successfully applied!'));
      } else {
        console.log(chalk.red('\n? VERIFICATION FAILED: Meta tags not applied correctly!'));
        console.log(chalk.yellow('\nExpected Title:'), metaTitle);
        console.log(chalk.yellow('Got Title:'), updated.seo_title);
        console.log(chalk.yellow('\nExpected Desc:'), metaDescription);
        console.log(chalk.yellow('Got Desc:'), updated.seo_description);
      }
      
      console.log(chalk.gray('\n' + '?'.repeat(70)));
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(chalk.blue.bold('\n\n? PROCESS COMPLETE\n'));
    
  } catch (error) {
    console.log(chalk.red(`\n? Fatal Error: ${error.message}`));
    console.log(chalk.gray(error.stack));
  }
}

function generateMetaTitle(title) {
  const MAX_LENGTH = 60;
  const BRAND = 'DLLHOME';
  const SEPARATOR = ' | ';
  
  let cleanTitle = title
    .replace(/1PC /gi, '')
    .replace(/1 PC /gi, '')
    .replace(/Random /gi, '')
    .replace(/High Quality /gi, '')
    .replace(/,\s*$/, '')
    .trim();
  
  const reservedSpace = BRAND.length + SEPARATOR.length;
  const availableForProduct = MAX_LENGTH - reservedSpace;
  
  const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'from', 'of'];
  const words = cleanTitle.split(' ').filter(word => 
    word.length > 0 && !fillerWords.includes(word.toLowerCase())
  );
  
  let productPart = '';
  for (const word of words) {
    const testTitle = productPart + (productPart ? ' ' : '') + word;
    if (testTitle.length <= availableForProduct) {
      productPart = testTitle;
    } else {
      break;
    }
  }
  
  if (!productPart) {
    productPart = cleanTitle.substring(0, availableForProduct);
  }
  
  const finalTitle = `${productPart}${SEPARATOR}${BRAND}`;
  
  return finalTitle.length > MAX_LENGTH 
    ? finalTitle.substring(0, MAX_LENGTH) 
    : finalTitle;
}

function generateMetaDescription(title) {
  const MAX_LENGTH = 160;
  
  let cleanTitle = title
    .replace(/1PC /gi, '')
    .replace(/1 PC /gi, '')
    .replace(/Random /gi, '')
    .replace(/High Quality /gi, '')
    .replace(/,\s*$/, '')
    .trim();
  
  const titleLower = cleanTitle.toLowerCase();
  let benefit = '';
  const cta = 'Shop now!';
  
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
  
  let productName = cleanTitle;
  const maxProductLength = MAX_LENGTH - benefit.length - cta.length - 6;
  
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
  
  let description = `${productName} - ${benefit}. ${cta}`;
  
  if (description.length > MAX_LENGTH) {
    description = description.substring(0, MAX_LENGTH - 3) + '...';
  }
  
  return description;
}

forceFixMeta();