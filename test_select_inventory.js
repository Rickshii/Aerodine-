import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env variables from .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Querying inventory table...');
    const { data, error, status, statusText } = await supabase
      .from('inventory')
      .select('*');

    console.log('Status:', status);
    console.log('Status Text:', statusText);
    
    if (error) {
      console.error('Select error:', error);
    } else {
      console.log('Fetched data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
