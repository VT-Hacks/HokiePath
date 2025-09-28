import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config';

export const geminiModel = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-pro',
  temperature: 0.3,
  apiKey: config.google.gemini_api_key,
});
