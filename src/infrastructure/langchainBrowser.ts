import { WebBrowser } from 'langchain/tools/webbrowser';
import { geminiModel } from './geimini';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { config } from '../config';

export const browser = new WebBrowser({
  model: geminiModel,
  embeddings: new GoogleGenerativeAIEmbeddings({
    apiKey: config.google.gemini_api_key,
    model: 'gemini-2.5-flash',
  }),
});
