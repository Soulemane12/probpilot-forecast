import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
} else {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = client;

export function assertSupabase() {
  if (!client) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }
  return client;
}
