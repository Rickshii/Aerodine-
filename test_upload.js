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
    console.log('Testing upload to rms_images storage bucket...');
    
    // Create a dummy text file buffer
    const fileBuffer = Buffer.from('test image content');
    const fileName = `test_upload_${Date.now()}.txt`;
    
    const { data, error } = await supabase.storage
      .from('rms_images')
      .upload(fileName, fileBuffer, {
        contentType: 'text/plain',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
    } else {
      console.log('Upload successful:', data);
      
      const { data: publicUrlData } = supabase.storage
        .from('rms_images')
        .getPublicUrl(fileName);
        
      console.log('Public URL:', publicUrlData.publicUrl);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
