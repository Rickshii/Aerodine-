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
    console.log('Testing insert of a minimal row into inventory...');
    const testItem = {
      name: 'Test minimal'
    };
    
    const { data, error } = await supabase
      .from('inventory')
      .insert([testItem])
      .select();
      
    if (error) {
      console.log('Insert error detail:', error);
    } else {
      console.log('Insert success:', data);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
