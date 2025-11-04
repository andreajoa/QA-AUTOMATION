import fetch from 'node-fetch';
import chalk from 'chalk';

const CONFIG = {
  url: process.env.SHOPIFY_STORE_URL || 'https://example.myshopify.com',
  token: process.env.SHOPIFY_ACCESS_TOKEN || ''
};

async function checkCurrentStatus() {
  console.log(chalk.blue.bold('\n? CHECKING CURRENT SHOPIFY STORE STATUS'));
  console.log(chalk.gray('???????????????????????????????????????????????????\n'));
  
  try {
    const response = await fetch(`${CONFIG.url}/admin/api/2023-10/products.json?limit=10`, {
      headers: { 'X-Shopify-Access-Token': CONFIG.token }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(chalk.cyan(`? Found ${data.products.length} products\n`));
    
    for (const product of data.products) {
      console.log(chalk.yellow(`\n??? PRODUCT: ${product.title} ???`));
      console.log(chalk.white('Product ID:'), product.id);
      
      // Check Meta Title
      if (product.seo_title) {
        const length = product.seo_title.length;
        const status = length <= 60 ? chalk.green('?') : chalk.red('?');
        console.log(chalk.white('Meta Title:'), status, `(${length}/60 chars)`);
        console.log(chalk.gray(`  "${product.seo_title}"`));
      } else {
        console.log(chalk.red('Meta Title: ? NOT SET'));
      }
      
      // Check Meta Description
      if (product.seo_description) {
        const length = product.seo_description.length;
        const status = length <= 160 ? chalk.green('?') : chalk.red('?');
        console.log(chalk.white('Meta Description:'), status, `(${length}/160 chars)`);
        console.log(chalk.gray(`  "${product.seo_description.substring(0, 100)}..."`));
      } else {
        console.log(chalk.red('Meta Description: ? NOT SET'));
      }
      
      // Check Alt Text
      const imagesWithoutAlt = product.images?.filter(img => !img.alt) || [];
      if (imagesWithoutAlt.length > 0) {
        console.log(chalk.red(`Alt Text: ? ${imagesWithoutAlt.length} images missing alt text`));
      } else if (product.images?.length > 0) {
        console.log(chalk.green(`Alt Text: ? All ${product.images.length} images have alt text`));
      }
      
      // Check Tags
      const tags = (product.tags || '').split(',').filter(Boolean);
      console.log(chalk.white(`Tags: ${tags.length} tags`), tags.length >= 5 ? chalk.green('?') : chalk.yellow('??'));
      
      console.log(chalk.gray('?'.repeat(70)));
    }
    
    console.log(chalk.blue.bold('\n? STATUS CHECK COMPLETE\n'));
    
  } catch (error) {
    console.log(chalk.red(`? Error: ${error.message}`));
  }
}

checkCurrentStatus();