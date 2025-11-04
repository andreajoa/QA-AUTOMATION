# 🚀 Shopify QA Automation - Cutting Edge System

A comprehensive, AI-powered Quality Assurance automation system for Shopify stores. This system performs automated quality checks, SEO optimization, and provides intelligent recommendations using multiple AI models with automatic fallback.

## ✨ Features

### Core Capabilities
- **🤖 AI-Powered Automation** - Uses multiple AI models (Gemini, Groq, OpenRouter) with automatic fallback
- **🏪 Multi-Store Support** - Manage and analyze multiple Shopify stores from one dashboard
- **📊 Comprehensive QA Analysis**:
  - SEO optimization (meta tags, descriptions, alt text)
  - Product quality checks (tags, types, descriptions)
  - Performance monitoring
  - Security testing
  - E2E testing with Playwright
- **🔄 Real-time Fixes** - Automatically fixes detected issues
- **📈 Analytics & Reporting** - SQLite database for historical tracking
- **🔐 OAuth Integration** - Secure Shopify OAuth for multi-store management
- **🌐 Web Dashboard** - Beautiful, real-time dashboard with live updates

### Technical Highlights
- **Modern Tech Stack**: Node.js, ES Modules, Express, Playwright
- **AI Integration**: Multiple AI providers with intelligent fallback
- **Database**: SQLite for analytics and historical data
- **Real-time**: Server-Sent Events (SSE) for live updates
- **Serverless Ready**: Vercel deployment support

## 🛠️ Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Shopify store credentials
- AI API keys (optional, for full functionality)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/andreajoa/QA-AUTOMATION.git
cd QA-AUTOMATION
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Shopify Configuration
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOPIFY_API_KEY=your_api_key
SHOPIFY_CLIENT_SECRET=your_client_secret
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_REDIRECT_URI=https://your-app-domain.com/auth/callback

# AI API Keys (at least one recommended)
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# External APIs (optional)
SERPAPI_KEY=your_serpapi_key
GOOGLE_API_KEY=your_google_key
AHREFS_API_KEY=your_ahrefs_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

## 🚀 Usage

### Local Development

**Start the QA automation system:**
```bash
npm start
```

**Run in development mode:**
```bash
npm run dev
```

**Test connections:**
```bash
npm test
```

The dashboard will be available at `http://localhost:3000`

### Available Scripts

- `npm start` - Start the main QA automation system
- `npm run dev` - Start with auto-run enabled
- `npm test` - Test all API connections

### Individual Modules

You can also run specific modules directly:

```bash
# Complete QA automation
node src/qa-complete-automation.js

# Auto-fix issues
node src/qa-autofix-real.js

# Check current store status
node src/check-current-status.js

# Multi-store cutting edge system
node src/qa-automation-multi-store.js
```

## 🌐 Vercel Deployment

This project is configured for easy deployment on Vercel.

### Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Set Environment Variables**

In your Vercel dashboard, go to your project settings and add all the environment variables from your `.env` file.

### Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy!

### Important Notes for Vercel

- **SQLite Database**: SQLite files won't persist on Vercel's serverless functions. Consider using:
  - Vercel Postgres (recommended for production)
  - External database service
  - Or use the system in read-only mode for QA checks

- **Playwright**: For E2E testing, you may need to configure Playwright for serverless environments or disable it for deployment.

## 📁 Project Structure

```
├── api/
│   └── index.js              # Vercel serverless entry point
├── src/
│   ├── qa-automation-multi-store.js    # Main multi-store system
│   ├── qa-automation-cutting-edge.js  # Cutting edge QA system
│   ├── qa-complete-automation.js       # Complete automation
│   ├── qa-autofix-real.js              # Real auto-fix system
│   ├── qa-engine.js                    # Core QA engine
│   ├── check-current-status.js         # Status checker
│   └── test-connections.js             # Connection tester
├── config.js                 # Configuration module
├── shopify-qa.js             # Main entry point
├── vercel.json               # Vercel configuration
└── package.json              # Dependencies
```

## 🔧 Configuration

The system uses a centralized configuration in `config.js` that reads from environment variables. All sensitive data should be stored in environment variables, never committed to the repository.

## 🎯 Use Cases

1. **Shopify Store Owners**: Automated quality checks and SEO optimization
2. **Agencies**: Manage multiple client stores from one dashboard
3. **Developers**: QA automation and testing for Shopify stores
4. **E-commerce Teams**: Continuous monitoring and optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for your portfolio or commercial purposes.

## 🙏 Acknowledgments

- Built with cutting-edge AI technologies
- Shopify API integration
- Modern web development practices

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This is a portfolio project demonstrating advanced QA automation capabilities for Shopify stores. Make sure to configure all environment variables properly before deployment.
