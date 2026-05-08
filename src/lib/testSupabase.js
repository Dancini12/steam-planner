import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadDotenv = async () => {
  const envPath = path.resolve(__dirname, '../../.env');
  const content = await fs.readFile(envPath, 'utf8');
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (key && value) {
      env[key] = value;
    }
  }

  return env;
};

const testConnection = async () => {
  try {
    const env = await loadDotenv();
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
    const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

    console.log('Supabase env check:', {
      VITE_SUPABASE_URL: supabaseUrl || null,
      VITE_SUPABASE_ANON_KEY: supabaseKey
        ? `${supabaseKey.slice(0, 8)}...${supabaseKey.slice(-6)}`
        : null,
      isSupabaseConfigured
    });

    if (!isSupabaseConfigured) {
      console.error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    console.log('Supabase projects query result:');
    console.log(JSON.stringify(data, null, 2));

    if (error) {
      console.error('Supabase projects query error:');
      console.error(error);
      process.exit(1);
    }

    console.log('✅ Supabase connection test completed successfully.');
    process.exit(0);
  } catch (exception) {
    console.error('Supabase connection test threw an exception:');
    console.error(exception);
    process.exit(1);
  }
};

testConnection();
