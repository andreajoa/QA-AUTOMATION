import fetch from 'node-fetch';
import chalk from 'chalk';

const CONFIG = {
  shopify: {
    url: process.env.SHOPIFY_STORE_URL || 'https://example.myshopify.com',
    token: process.env.SHOPIFY_ACCESS_TOKEN || '',
    apiKey: process.env.SHOPIFY_API_KEY || '',
    secret: process.env.SHOPIFY_CLIENT_SECRET || ''
  }
};

let stats = { 
  analyzed: 0, 
  needFixes: 0,
  altText: 0, 
  tags: 0, 
  metaTags: 0, 
  productType: 0, 
  errors: 0 
};

async function startAutoFix() {
  console.log(chalk.blue.bold('\n🤖 SHOPIFY AUTO-FIX - CORREÇÃO COMPLETA'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  
  try {
    await testConnection();
    const allProducts = await getAllProducts();
    
    console.log(chalk.blue(`\n🔍 Analisando ${allProducts.length} produtos...`));
    
    // Primeiro, detectar quais produtos precisam de correção
    const productsToFix = [];
    for (const product of allProducts) {
      const needsFix = analyzeProduct(product);
      if (needsFix.hasIssues) {
        productsToFix.push({ product, issues: needsFix.issues });
        stats.needFixes++;
      }
      stats.analyzed++;
    }
    
    console.log(chalk.yellow(`\n📊 DETECTADOS: ${stats.needFixes} produtos precisam de correção`));
    console.log(chalk.blue(`🚀 INICIANDO CORREÇÕES AUTOMÁTICAS...`));
    
    // Agora corrigir todos os produtos que precisam
    for (const item of productsToFix) {
      await fixProduct(item.product, item.issues);
    }
    
    showFinalResults();
    
  } catch (error) {
    console.log(chalk.red(`❌ Erro: ${error.message}`));
  }
}

async function testConnection() {
  const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/shop.json`, {
    headers: { 'X-Shopify-Access-Token': CONFIG.shopify.token }
  });
  
  if (!response.ok) throw new Error(`Conexão falhou: ${response.status}`);
  
  const data = await response.json();
  console.log(chalk.green(`✅ Conectado: ${data.shop.name}`));
}

async function getAllProducts() {
  let allProducts = [];
  let hasNextPage = true;
  let pageInfo = '';
  
  while (hasNextPage) {
    const url = pageInfo 
      ? `${CONFIG.shopify.url}/admin/api/2023-10/products.json?limit=250&page_info=${pageInfo}`
      : `${CONFIG.shopify.url}/admin/api/2023-10/products.json?limit=250`;
    
    const response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': CONFIG.shopify.token }
    });
    
    const data = await response.json();
    allProducts.push(...(data.products || []));
    
    // Verificar se há próxima página
    const linkHeader = response.headers.get('Link');
    hasNextPage = linkHeader && linkHeader.includes('rel="next"');
    if (hasNextPage) {
      const nextMatch = linkHeader.match(/page_info=([^&>]+)/);
      pageInfo = nextMatch ? nextMatch[1] : '';
    }
  }
  
  return allProducts;
}

function analyzeProduct(product) {
  const issues = {
    needsAltText: false,
    needsTags: false,
    needsMetaTags: false,
    needsProductType: false
  };
  
  // Verificar alt text
  const missingAltImages = product.images?.filter(img => !img.alt || img.alt.trim() === '') || [];
  if (missingAltImages.length > 0) {
    issues.needsAltText = true;
  }
  
  // Verificar tags SEO
  const currentTags = (product.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const hasBasicSeoTags = currentTags.some(tag => 
    tag.toLowerCase().includes('seo') || 
    tag.toLowerCase().includes('quality') ||
    tag.toLowerCase().includes('optimized')
  );
  if (!hasBasicSeoTags) {
    issues.needsTags = true;
  }
  
  // Verificar meta tags
  if (!product.seo_title || !product.seo_description) {
    issues.needsMetaTags = true;
  }
  
  // Verificar tipo de produto
  if (!product.product_type || product.product_type.trim() === '') {
    issues.needsProductType = true;
  }
  
  const hasIssues = Object.values(issues).some(Boolean);
  return { hasIssues, issues };
}

async function fixProduct(product, issues) {
  console.log(chalk.cyan(`\n🔧 ${product.title.substring(0, 50)}...`));
  
  if (issues.needsAltText) await fixAltText(product);
  if (issues.needsTags) await fixTags(product);
  if (issues.needsMetaTags) await fixMetaTags(product);
  if (issues.needsProductType) await fixProductType(product);
}

async function fixAltText(product) {
  const imagesToFix = product.images?.filter(img => !img.alt || img.alt.trim() === '') || [];
  
  console.log(chalk.yellow(`  🖼️  Corrigindo ${imagesToFix.length} imagens...`));
  
  for (const image of imagesToFix) {
    const altText = generateAltText(product.title);
    
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
        console.log(chalk.green(`    ✅ Alt text aplicado`));
        stats.altText++;
      } else {
        console.log(chalk.red(`    ❌ Erro ${response.status}`));
        stats.errors++;
      }
      
      // Rate limiting - aguardar entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(chalk.red(`    ❌ Erro: ${error.message}`));
      stats.errors++;
    }
  }
}

async function fixTags(product) {
  const currentTags = (product.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const seoTags = generateSeoTags(product.title);
  const newTags = seoTags.filter(tag => !currentTags.some(existing => existing.toLowerCase() === tag.toLowerCase()));
  
  if (newTags.length === 0) return;
  
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
      console.log(chalk.green(`  ✅ ${newTags.length} tags SEO adicionadas`));
      stats.tags++;
    } else {
      console.log(chalk.red(`  ❌ Erro tags: ${response.status}`));
      stats.errors++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.log(chalk.red(`  ❌ Erro tags: ${error.message}`));
    stats.errors++;
  }
}

async function fixMetaTags(product) {
  const metaTitle = generateMetaTitle(product.title);
  const metaDescription = generateMetaDescription(product.title);
  
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
      console.log(chalk.green(`  ✅ Meta tags SEO aplicadas`));
      stats.metaTags++;
    } else {
      console.log(chalk.red(`  ❌ Erro meta: ${response.status}`));
      stats.errors++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.log(chalk.red(`  ❌ Erro meta: ${error.message}`));
    stats.errors++;
  }
}

async function fixProductType(product) {
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
      console.log(chalk.green(`  ✅ Tipo "${productType}" definido`));
      stats.productType++;
    } else {
      console.log(chalk.red(`  ❌ Erro tipo: ${response.status}`));
      stats.errors++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.log(chalk.red(`  ❌ Erro tipo: ${error.message}`));
    stats.errors++;
  }
}

function generateAltText(title) {
  return title.replace(/[^\w\s-]/gi, '').trim().split(' ').slice(0, 10).join(' ');
}

function generateSeoTags(title) {
  const words = title.toLowerCase().replace(/[^\w\s-]/gi, '').split(' ').filter(w => w.length > 3);
  return [...new Set([...words.slice(0, 4), 'SEO Optimized', 'Quality Product', 'VitrineTemTudo'])];
}

function generateMetaTitle(title) {
  if (title.length <= 57) return title + ' | VitrineTemTudo';
  return title.substring(0, 45) + '... | VitrineTemTudo';
}

function generateMetaDescription(title) {
  return `Compre ${title} com melhor preço e qualidade garantida. Entrega rápida e segura na VitrineTemTudo. Aproveite!`.substring(0, 157) + '...';
}

function generateProductType(title) {
  const titleLower = title.toLowerCase();
  const categories = {
    'Electronics': ['phone', 'watch', 'charger', 'smart', 'digital', 'bluetooth', 'battery', 'usb'],
    'Home & Garden': ['home', 'kitchen', 'bathroom', 'holder', 'garden', 'light', 'decanter', 'slicer'],
    'Fashion': ['clothing', 'jacket', 'fashion', 'wear', 'bracelet', 'necklace'],
    'Health & Beauty': ['beauty', 'massage', 'fitness', 'health', 'trimmer', 'vacuum'],
    'Sports & Outdoors': ['sport', 'game', 'ball', 'fitness'],
    'Automotive': ['car', 'auto', 'vehicle'],
    'Toys & Games': ['toy', 'game', 'children', 'kids', 'blocks'],
    'Tools': ['tool', 'equipment', 'razor']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return category;
    }
  }
  return 'General Products';
}

function showFinalResults() {
  console.log(chalk.blue.bold('\n🎉 CORREÇÃO AUTOMÁTICA FINALIZADA!'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.blue(`📊 Produtos analisados: ${stats.analyzed}`));
  console.log(chalk.yellow(`🔍 Produtos que precisavam correção: ${stats.needFixes}`));
  console.log(chalk.green(`✅ Alt texts corrigidos: ${stats.altText}`));
  console.log(chalk.green(`✅ Produtos com tags SEO: ${stats.tags}`));
  console.log(chalk.green(`✅ Meta tags aplicadas: ${stats.metaTags}`));
  console.log(chalk.green(`✅ Tipos definidos: ${stats.productType}`));
  console.log(chalk.red(`❌ Erros encontrados: ${stats.errors}`));
  
  const totalFixes = stats.altText + stats.tags + stats.metaTags + stats.productType;
  console.log(chalk.blue.bold(`\n🚀 TOTAL: ${totalFixes} correções aplicadas automaticamente!`));
}

startAutoFix();
