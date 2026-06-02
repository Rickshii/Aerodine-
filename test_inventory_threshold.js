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
      'min_qty',
      'min_quantity',
      'alert_qty',
      'alert_quantity',
      'alert_level',
      'threshold_qty',
      'threshold_quantity',
      'stock_alert',
      'reorder_point',
      'reorder'
    ];

    for (const field of fieldsToTest) {
      const payload = { item_name: 'Test', quantity: 5, unit: 'g', [field]: 5 };
      const { error } = await supabase
        .from('inventory')
        .insert([payload])
        .select();
        
      if (error && error.message.includes('Could not find')) {
        // failed
      } else {
        console.log(`Found candidate field: ${field}. Error:`, error ? error.message : 'None');
      }
    }
    console.log('Done testing.');
  } catch (err) {
    console.error(err);
  }
}

run();
