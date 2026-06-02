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

async function run() {
  try {
    const url = `${supabaseUrl}/rest/v1/inventory?select=*`;
    console.log('Fetching CSV header for inventory from:', url);
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'text/csv'
      }
    });
    const data = await res.text();
    console.log('Response status:', res.status);
    console.log('CSV Response:');
    console.log(data);
  } catch (err) {
    console.error('Error fetching CSV header:', err);
  }
}

run();
