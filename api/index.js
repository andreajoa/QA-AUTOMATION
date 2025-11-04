// Vercel Serverless Function Entry Point
import express from 'express';
import MultiStoreCuttingEdgeQASystem from '../src/qa-automation-multi-store.js';

const app = express();
app.use(express.json());

// Initialize the QA system
let qaSystem;
let qaApp;

try {
  qaSystem = new MultiStoreCuttingEdgeQASystem();
  qaApp = qaSystem.initWebServer();
} catch (error) {
  console.error('Error initializing QA system:', error);
  // Fallback route
  app.get('/', (req, res) => {
    res.json({ 
      error: 'QA System initialization failed',
      message: error.message 
    });
  });
}

// Export the Express app for Vercel
export default qaApp || app;
