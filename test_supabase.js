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

console.log('Supabase URL:', supabaseUrl);
console.log('Key prefix:', supabaseAnonKey ? supabaseAnonKey.substring(0, 15) : 'undefined');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('\n--- Querying menu_items ---');
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*');
    if (menuError) {
      console.error('menu_items error:', menuError);
    } else {
      console.log(`Successfully fetched ${menuItems.length} menu items:`, menuItems);
    }

    console.log('\n--- Querying users ---');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    if (usersError) {
      console.error('users error:', usersError);
    } else {
      console.log(`Successfully fetched ${users.length} users:`, users);
    }

    console.log('\n--- Querying orders ---');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    if (ordersError) {
      console.error('orders error:', ordersError);
    } else {
      console.log(`Successfully fetched orders:`, orders);
    }

  } catch (err) {
    console.error('Unhandled error:', err);
  }
}

run();
