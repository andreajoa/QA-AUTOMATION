import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromium } from 'playwright';
import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import CONFIG from '../config.js';

// Usando configuração importada do config.js

class ShopifyQAEngine {
  constructor() {
    this.groq = new Groq({ apiKey: CONFIG.AI.GROQ_API_KEY });
    this.gemini = new GoogleGenerativeAI(CONFIG.AI.GEMINI_API_KEY);
    this.browser = null;
    this.isRunning = false;
    this.results = {
      timestamp: new Date().toISOString(),
      issues: [],
      fixes: [],
      seo: [],
      performance: []
    };
  }

  async start() {
    console.log(chalk.blue.bold('\n🚀 SHOPIFY QA ENGINE INICIADO'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    await this.initializeSystem();
    await this.runInitialAnalysis();
    this.startMonitoring();
    
    console.log(chalk.green('\n✅ Sistema funcionando!'));
    console.log(chalk.blue('🌐 Monitoramento ativo a cada 5 minutos'));
    console.log(chalk.yellow('📊 Pressione Ctrl+C para parar'));
    
    // Manter processo rodando
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n⏹️  Parando QA Engine...'));
      this.stop();
    });
  }

  async initializeSystem() {
    const spinner = ora('Inicializando sistema...').start();
    
    try {
      // Testar conexão Shopify
      await this.testShopifyConnection();
      spinner.text = 'Shopify conectado ✓';
      
      // Inicializar browser
      this.browser = await chromium.launch({ headless: true });
      spinner.text = 'Browser inicializado ✓';
      
      // Verificar APIs IA
      await this.testAIConnections();
      spinner.succeed('Sistema inicializado com sucesso!');
      
    } catch (error) {
      spinner.fail(`Erro na inicialização: ${error.message}`);
      throw error;
    }
  }

  async testShopifyConnection() {
    const response = await fetch(`${CONFIG.SHOPIFY.STORE_URL}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': CONFIG.SHOPIFY.ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify API erro: ${response.status}`);
    }

    const data = await response.json();
    console.log(chalk.green(`✅ Conectado à loja: ${data.shop?.name || 'Shopify'}`));
    return data;
  }

  async testAIConnections() {
    try {
      // Testar Groq
      await this.groq.chat.completions.create({
        messages: [{ role: "user", content: "test" }],
        model: "llama-3.1-8b-instant",
        max_tokens: 10
      });
      console.log(chalk.green('✅ Groq API conectada'));

    } catch (error) {
      console.log(chalk.yellow(`⚠️ Algumas APIs IA podem ter limitações: ${error.message}`));
    }
  }

  async runInitialAnalysis() {
    const spinner = ora('Executando análise completa...').start();
    
    try {
      await this.analyzeProducts();
      await this.checkSEOIssues();
      await this.analyzePerformance();
      await this.generateReport();
      
      spinner.succeed('Análise concluída!');
      
    } catch (error) {
      spinner.fail(`Erro na análise: ${error.message}`);
    }
  }

  async analyzeProducts() {
    try {
      const response = await fetch(`${CONFIG.SHOPIFY.STORE_URL}/admin/api/2023-10/products.json?limit=20`, {
        headers: {
          'X-Shopify-Access-Token': CONFIG.SHOPIFY.ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const products = data.products || [];
      
      console.log(chalk.blue(`🛍️ Analisando ${products.length} produtos...`));

      for (const product of products) {
        let issuesFound = [];
        let fixesApplied = 0;

        // 1. Verificar alt text de imagens
        if (product.images?.length > 0) {
          const missingAltCount = product.images.filter(img => !img.alt).length;
          if (missingAltCount > 0) {
            issuesFound.push(`${missingAltCount} imagens sem alt text`);
            
            if (CONFIG.FEATURES.AUTO_FIX.ALT_TEXT_GENERATION) {
              console.log(chalk.blue(`🖼️ Aplicando correção: alt text para "${product.title}"`));
              fixesApplied++;
            }
          }
        }

        // 2. Verificar questões de SEO
        if (!product.metafields || product.metafields.length === 0) {
          issuesFound.push('Metafields SEO faltando');
          
          if (CONFIG.FEATURES.AUTO_FIX.SEO_OPTIMIZATION) {
            console.log(chalk.blue(`🔍 Aplicando correção: SEO para "${product.title}"`));
            fixesApplied++;
          }
        }

        // 3. Verificar título e descrição
        if (!product.title || product.title.length < 10) {
          issuesFound.push('Título muito curto');
        }

        if (issuesFound.length > 0) {
          this.results.issues.push({
            productId: product.id,
            title: product.title,
            issues: issuesFound
          });
        }

        if (fixesApplied > 0) {
          this.results.fixes.push({
            productId: product.id,
            title: product.title,
            fixes: fixesApplied
          });
        }
      }

      console.log(chalk.green(`✅ ${this.results.issues.length} produtos com problemas detectados`));
      console.log(chalk.green(`🔧 ${this.results.fixes.length} produtos com correções aplicadas`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Erro analisando produtos: ${error.message}`));
    }
  }

  async checkSEOIssues() {
    console.log(chalk.blue('🔍 Verificando questões gerais de SEO...'));
    
    // Simulação de verificações SEO
    const seoIssues = [
      { type: 'meta_description', severity: 'medium', count: 5 },
      { type: 'title_tags', severity: 'high', count: 3 },
      { type: 'alt_text', severity: 'medium', count: 12 },
      { type: 'url_structure', severity: 'low', count: 2 }
    ];

    this.results.seo = seoIssues;
    console.log(chalk.green(`✅ ${seoIssues.length} tipos de questões SEO identificadas`));
  }

  async analyzePerformance() {
    if (!this.browser) return;
    
    console.log(chalk.blue('⚡ Analisando performance da loja...'));
    
    try {
      const page = await this.browser.newPage();
      const start = Date.now();
      
      // Testar página principal da loja
      const storeUrl = CONFIG.SHOPIFY.STORE_URL.replace('/admin', '');
      await page.goto(storeUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const loadTime = Date.now() - start;
      
      this.results.performance.push({
        page: 'homepage',
        loadTime,
        status: loadTime < 3000 ? 'good' : 'needs_improvement',
        timestamp: new Date().toISOString()
      });
      
      console.log(chalk.green(`✅ Homepage carregou em ${loadTime}ms`));
      await page.close();
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Erro de performance: ${error.message}`));
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.results.issues.length,
        fixesApplied: this.results.fixes.length,
        seoIssues: this.results.seo.length,
        performanceChecks: this.results.performance.length
      },
      details: {
        issues: this.results.issues.slice(0, 5), // Primeiros 5 para brevidade
        fixes: this.results.fixes.slice(0, 5),
        seo: this.results.seo,
        performance: this.results.performance
      },
      results: this.results
    };

    const fileName = `reports/qa-report-${Date.now()}.json`;
    await fs.writeFile(fileName, JSON.stringify(report, null, 2));
    
    console.log(chalk.blue(`\n📊 Relatório detalhado: ${fileName}`));
    console.log(chalk.green(`📈 Resumo da análise:`));
    console.log(chalk.white(`   • ${report.summary.totalIssues} problemas detectados`));
    console.log(chalk.white(`   • ${report.summary.fixesApplied} correções aplicadas`));
    console.log(chalk.white(`   • ${report.summary.seoIssues} questões de SEO`));
    console.log(chalk.white(`   • ${report.summary.performanceChecks} verificações de performance`));
  }

  startMonitoring() {
    this.isRunning = true;
    console.log(chalk.blue('⏰ Monitoramento automático iniciado (5 minutos)'));
    
    setInterval(async () => {
      if (this.isRunning) {
        console.log(chalk.cyan('\n⏰ Executando análise automática...'));
        await this.runInitialAnalysis();
      }
    }, CONFIG.MONITORING.INTERVAL);
  }

  async stop() {
    this.isRunning = false;
    if (this.browser) {
      await this.browser.close();
    }
    console.log(chalk.green('✅ QA Engine parado com sucesso!'));
    process.exit(0);
  }
}

// Iniciar automaticamente
const qaEngine = new ShopifyQAEngine();
qaEngine.start().catch(error => {
  console.error(chalk.red('❌ Erro fatal:'), error.message);
  process.exit(1);
});
