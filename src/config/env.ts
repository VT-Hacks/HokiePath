import { config as loadEnv } from 'dotenv';
import fs from 'fs';
const envPath =
  process.env.NODE_ENV === 'production' ? '.env' : '.env.development';

if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath });
  console.log(`Loaded env from ${envPath}`);
} else {
  console.warn(`No env file found at ${envPath}`);
}
const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: +(process.env.PORT ?? 8000),
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_KEY: required('SUPABASE_API_KEY'),
  GOOGLE_API_KEY: required('GOOGLE_CUSTOM_SEARCH_API'),
  GOOGLE_CSE_ID: required('GOOGLE_CSE_ID'),
  GOOGLE_GEMINI_API_KEY: required('GOOGLE_GEMINI_API_KEY'),
  TOGETHER_API_KEY: required('TOGETHER_API_KEY')
};
