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
    const fieldsToTest = [
      'quantity',
      'stock',
      'unit',
      'category',
      'threshold',
      'stock_threshold',
      'stockThreshold',
      'min_stock'
    ];

    for (const field of fieldsToTest) {
      const payload = { item_name: 'Test', [field]: 5 };
      console.log(`Testing field (${field})...`);
      const { error } = await supabase
        .from('inventory')
        .insert([payload])
        .select();
        
      if (error) {
        console.log(`  Result for ${field}:`, error.message);
      } else {
        console.log(`  Result for ${field}: Success (RLS violated but column accepted)`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
