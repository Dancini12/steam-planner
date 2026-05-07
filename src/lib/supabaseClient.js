import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error("Erro ao criar cliente Supabase:", err);
  }
} else {
  console.warn("Variáveis do Supabase não definidas");
}

export const isSupabaseConfigured = Boolean(supabase);
export { supabase };
