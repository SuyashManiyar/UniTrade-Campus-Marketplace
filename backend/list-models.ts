import { config } from 'dotenv';
config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try different model names
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\nTrying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      const text = response.text();
      console.log(`✓ ${modelName} works! Response: ${text.substring(0, 50)}...`);
      break; // Stop after first working model
    } catch (error: any) {
      console.log(`✗ ${modelName} failed: ${error.message?.substring(0, 100)}`);
    }
  }
}

listModels();
