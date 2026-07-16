import { env } from './src/config/env.js';
import { GoogleGenAI } from '@google/genai';

async function listModels() {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.list();
  
  for await (const model of response) {
    if (model.name.includes('gemini') && model.supportedActions.includes('generateContent')) {
      console.log(model.name);
    }
  }
}

listModels().catch(console.error);
