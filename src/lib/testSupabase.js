import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadDotenv = async () => {
  const envPath = path.resolve(__dirname, '../../.env');
  const content = await fs.readFile(envPath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (key && value && !(key in process.env)) {
      process.env[key] = value;
    }
  }
};

const testConnection = async () => {
  try {
    await loadDotenv();
    const { supabase } = await import('./supabaseClient.js');
    const { data, error } = await supabase.auth.getSession();

    console.log('Supabase auth.getSession result:');
    console.log(JSON.stringify(data, null, 2));

    if (error) {
      console.error('Supabase auth.getSession error:');
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
