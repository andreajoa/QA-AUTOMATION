import fetch from 'node-fetch';
import chalk from 'chalk';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CONFIG = {
  shopify: {
    url: process.env.SHOPIFY_STORE_URL || 'https://example.myshopify.com',
    token: process.env.SHOPIFY_ACCESS_TOKEN || '',
    apiKey: process.env.SHOPIFY_API_KEY || '',
    secret: process.env.SHOPIFY_CLIENT_SECRET || ''
  },
  ai: {
    groq: process.env.GROQ_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || ''
  }
};

console.log(chalk.blue.bold('🧪 TESTANDO TODAS AS CONEXÕES'));
console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

async function testShopify() {
  console.log(chalk.yellow('🛍️  Testando Shopify API...'));
  
  try {
    const response = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': CONFIG.shopify.token,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(chalk.green(`✅ Shopify: Conectado à loja "${data.shop?.name || 'Unnamed'}"`));
      console.log(chalk.gray(`   • URL: ${CONFIG.shopify.url}`));
      console.log(chalk.gray(`   • Status: ${response.status}`));
      
      // Testar produtos também
      const productsResponse = await fetch(`${CONFIG.shopify.url}/admin/api/2023-10/products.json?limit=3`, {
        headers: {
          'X-Shopify-Access-Token': CONFIG.shopify.token,
          'Content-Type': 'application/json'
        }
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        console.log(chalk.gray(`   • Produtos encontrados: ${productsData.products?.length || 0}`));
      }
      
      return true;
    } else {
      console.log(chalk.red(`❌ Shopify: Erro ${response.status} - ${response.statusText}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`❌ Shopify: ${error.message}`));
    return false;
  }
}

async function testGroq() {
  console.log(chalk.yellow('🤖 Testando Groq AI...'));
  
  try {
    const groq = new Groq({ apiKey: CONFIG.ai.groq });
    
    const completion = await groq.chat.completions.create({
      messages: [{ 
        role: "user", 
        content: "Responda apenas: 'Groq funcionando!'" 
      }],
      model: "llama-3.1-8b-instant",
      max_tokens: 10,
      temperature: 0
    });

    const response = completion.choices[0]?.message?.content || '';
    console.log(chalk.green('✅ Groq AI: Conectado e funcionando'));
    console.log(chalk.gray(`   • Resposta: ${response.trim()}`));
    return true;
    
  } catch (error) {
    console.log(chalk.red(`❌ Groq AI: ${error.message}`));
    return false;
  }
}

async function testGemini() {
  console.log(chalk.yellow('💎 Testando Gemini AI...'));
  
  try {
    const genAI = new GoogleGenerativeAI(CONFIG.ai.gemini);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent('Responda apenas: "Gemini funcionando!"');
    const response = await result.response;
    const text = response.text();
    
    console.log(chalk.green('✅ Gemini AI: Conectado e funcionando'));
    console.log(chalk.gray(`   • Resposta: ${text.trim()}`));
    return true;
    
  } catch (error) {
    console.log(chalk.red(`❌ Gemini AI: ${error.message}`));
    return false;
  }
}

async function testPlaywright() {
  console.log(chalk.yellow('🎭 Testando Playwright...'));
  
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    await browser.close();
    
    console.log(chalk.green('✅ Playwright: Browser funcionando'));
    return true;
    
  } catch (error) {
    console.log(chalk.red(`❌ Playwright: ${error.message}`));
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  const tests = [
    { name: 'Shopify', test: testShopify },
    { name: 'Groq AI', test: testGroq },
    { name: 'Gemini AI', test: testGemini },
    { name: 'Playwright', test: testPlaywright }
  ];

  console.log(chalk.blue(`\n🚀 Executando ${tests.length} testes...\n`));

  const results = {};
  
  for (const { name, test } of tests) {
    try {
      results[name] = await test();
    } catch (error) {
      console.log(chalk.red(`❌ ${name}: Falha crítica - ${error.message}`));
      results[name] = false;
    }
    console.log(''); // Linha em branco
  }

  // Resumo final
  console.log(chalk.blue.bold('📊 RESUMO DOS TESTES'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [name, passed] of Object.entries(results)) {
    const status = passed ? chalk.green('✅ PASSOU') : chalk.red('❌ FALHOU');
    console.log(`${status} ${name}`);
  }
  
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  
  if (passed === total) {
    console.log(chalk.green.bold(`🎉 TODOS OS TESTES PASSARAM! (${passed}/${total})`));
    console.log(chalk.blue('\n🚀 Sistema pronto para usar:'));
    console.log(chalk.white('   npm start    # Iniciar QA Engine'));
    console.log(chalk.white('   npm run dev  # Modo desenvolvimento'));
  } else {
    console.log(chalk.yellow.bold(`⚠️  ${passed}/${total} testes passaram`));
    console.log(chalk.gray('🔧 Verifique as configurações dos serviços que falharam'));
    
    if (results['Shopify']) {
      console.log(chalk.blue('\n🚀 Shopify funcionando - você pode tentar:'));
      console.log(chalk.white('   npm start    # Iniciar mesmo assim'));
    }
  }
  
  console.log('');
}

// Executar
runAllTests().catch(error => {
  console.error(chalk.red('❌ Erro crítico nos testes:'), error.message);
  process.exit(1);
});
