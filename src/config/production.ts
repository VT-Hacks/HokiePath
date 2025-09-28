import { defaultConfig } from './default';
import { env } from './env';

export const productionConfig = {
  ...defaultConfig,
  env: env.NODE_ENV,
  port: env.PORT,
  supabase: { url: env.SUPABASE_URL, key: env.SUPABASE_KEY },
  google: {
    key: env.GOOGLE_API_KEY,
    id: env.GOOGLE_CSE_ID,
    gemini_api_key: env.GOOGLE_API_KEY,
  },
  togetherApi: env.TOGETHER_API_KEY,

};
