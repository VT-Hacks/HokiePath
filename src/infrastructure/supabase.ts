import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { Database } from '../common/types/supabase';
export const supabase = createClient<Database>(config.supabase.url, config.supabase.key, {
  auth: {
    persistSession: false,
  },
});
