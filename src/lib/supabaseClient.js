import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : process.env;
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const hasPlaceholderUrl = SUPABASE_URL && SUPABASE_URL.includes('SEU_PROJETO');

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !hasPlaceholderUrl
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase nao configurado. Verifique VITE_SUPABASE_URL e ' +
    'VITE_SUPABASE_ANON_KEY no arquivo .env'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
