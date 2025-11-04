// Configuração da aplicação Shopify QA
export const CONFIG = {
  SHOPIFY: {
    STORE_URL: process.env.SHOPIFY_STORE_URL || 'https://example.myshopify.com',
    ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN || '',
    API_KEY: process.env.SHOPIFY_API_KEY || '',
    CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET || ''
  },
  
  AI: {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
  },
  
  SERVER: {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  
  FEATURES: {
    AUTO_FIX: {
      SEO_OPTIMIZATION: true,
      ALT_TEXT_GENERATION: true,
      META_TAGS: true,
      STOCK_UPDATES: false,
      PRICE_CHANGES: false,
      PRODUCT_DESCRIPTIONS: false
    }
  },
  
  MONITORING: {
    INTERVAL: 300000, // 5 minutos
    TIMEOUT: 30000
  }
};

export default CONFIG;