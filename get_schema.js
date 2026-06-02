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
    const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`;
    console.log('Fetching OpenAPI schema from:', url);
    const res = await fetch(url);
    const data = await res.json();
    
    // Save to schema_openapi.json for inspection
    fs.writeFileSync('schema_openapi.json', JSON.stringify(data, null, 2));
    console.log('OpenAPI schema saved to schema_openapi.json');
    
    // Print all tables and their columns
    if (data.definitions) {
      console.log('Tables found in definitions:');
      for (const table of Object.keys(data.definitions)) {
        console.log(`- Table: ${table}`);
        const properties = data.definitions[table].properties;
        if (properties) {
          for (const col of Object.keys(properties)) {
            console.log(`  * Column: ${col} (${properties[col].type})`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching OpenAPI schema:', err);
  }
}

run();
