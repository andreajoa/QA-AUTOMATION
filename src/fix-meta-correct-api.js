import fetch from 'node-fetch';
import chalk from 'chalk';

const CONFIG = {
  url: process.env.SHOPIFY_STORE_URL || 'https://example.myshopify.com',
  token: process.env.SHOPIFY_ACCESS_TOKEN || ''
};

async function fixMetaCorrectAPI() {
  console.log(chalk.blue.bold('\n? FIXING META TAGS - CORRECT API'));
  console.log(chalk.gray('???????????????????????????????????????????????????\n'));
  
  try {
    // Get products with full details
    const response = await fetch(`${CONFIG.url}/admin/api/2023-10/products.json?fields=id,title,handle,seo_title,seo_description`, {
      headers: { 
        'X-Shopify-Access-Token': CONFIG.token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get products: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(chalk.cyan(`? Found ${data.products.length} products\n`));
    
    for (const product of data.products) {
      console.log(chalk.yellow(`\n??? ${product.title.substring(0, 50)} ???`));
      
      const metaTitle = generateMetaTitle(product.title);
      const metaDescription = generateMetaDescription(product.title);
      
      console.log(chalk.blue('\n? New Meta Tags:'));
      console.log(chalk.white(`  Title: ${metaTitle} (${metaTitle.length} chars)`));
      console.log(chalk.white(`  Desc: ${metaDescription} (${metaDescription.length} chars)`));
      
      // Try GraphQL API instead
      console.log(chalk.yellow('\n? Trying GraphQL API...'));
      
      const graphqlQuery = `
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              title
              seo {
                title
                description
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const graphqlVariables = {
        input: {
          id: `gid://shopify/Product/${product.id}`,
          seo: {
            title: metaTitle,
            description: metaDescription
          }
        }
      };
      
      const graphqlResponse = await fetch(`${CONFIG.url}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': CONFIG.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: graphqlVariables
        })
      });
      
      const graphqlResult = await graphqlResponse.json();
      
      if (graphqlResult.errors) {
        console.log(chalk.red('\n? GraphQL Errors:'));
        console.log(graphqlResult.errors);
        
        // Try REST API as fallback
        console.log(chalk.yellow('\n? Trying REST API...'));
        await tryRestAPI(product.id, metaTitle, metaDescription);
        
      } else if (graphqlResult.data?.productUpdate?.userErrors?.length > 0) {
        console.log(chalk.red('\n? User Errors:'));
        console.log(graphqlResult.data.productUpdate.userErrors);
        
        // Try REST API as fallback
        await tryRestAPI(product.id, metaTitle, metaDescription);
        
      } else {
        console.log(chalk.green('\n? GraphQL Success!'));
        const updated = graphqlResult.data.productUpdate.product;
        console.log(chalk.cyan('\nVerification:'));
        console.log(chalk.white('  SEO Title:'), updated.seo?.title || chalk.red('NOT SET'));
        console.log(chalk.white('  SEO Desc:'), updated.seo?.description || chalk.red('NOT SET'));
      }
      
      console.log(chalk.gray('\n' + '?'.repeat(70)));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(chalk.blue.bold('\n\n? COMPLETE - Check your store now!\n'));
    
  } catch (error) {
    console.log(chalk.red(`\n? Error: ${error.message}`));
    console.log(chalk.gray(error.stack));
  }
}

async function tryRestAPI(productId, metaTitle, metaDescription) {
  try {
    const updateData = {
      product: {
        id: productId,
        metafields_global_title_tag: metaTitle,
        metafields_global_description_tag: metaDescription
      }
    };
    
    const response = await fetch(`${CONFIG.url}/admin/api/2023-10/products/${productId}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': CONFIG.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      console.log(chalk.green('? REST API Success!'));
    } else {
      const errorText = await response.text();
      console.log(chalk.red(`? REST API Failed: ${response.status}`));
      console.log(chalk.gray(errorText));
    }
  } catch (error) {
    console.log(chalk.red(`? REST API Error: ${error.message}`));
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

fixMetaCorrectAPI();