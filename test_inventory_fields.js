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
    const payloads = [
      { label: 'id, qty, unit', data: { id: 'g_test_1', qty: 10, unit: 'kg' } },
      { label: 'name only', data: { name: 'Test minimal' } },
      { label: 'item_name', data: { item_name: 'Test item_name' } },
      { label: 'title', data: { title: 'Test title' } }
    ];

    for (const payload of payloads) {
      console.log(`Testing payload (${payload.label}):`, payload.data);
      const { data, error } = await supabase
        .from('inventory')
        .insert([payload.data])
        .select();
        
      if (error) {
        console.log(`Result:`, error.message);
      } else {
        console.log(`Result: Success!`, data);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
