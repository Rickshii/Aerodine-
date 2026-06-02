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
    console.log('Testing insert of all menu item columns...');
    const testItem = {
      name: 'Test Full',
      price: 15.99,
      description: 'Tasty test description',
      special_badges: ['New', 'Popular'],
      prep_time: 20,
      time_range: 'Lunch',
      dietary: 'Veg',
      is_combo: false,
      combo_items: []
    };
    
    const { data, error } = await supabase
      .from('menu_items')
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
