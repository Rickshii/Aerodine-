import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initialize the Supabase client only if configured.
// We provide a dummy URL/key if not configured to prevent crash, since some imports might expect an object, 
// though we guard actual calls with isSupabaseConfigured.
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://xyz.supabase.co', 'public-anon-key');
