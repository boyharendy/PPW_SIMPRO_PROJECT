import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a singleton browser Supabase Client.
 * Gracefully provides a fallback when credentials are not yet configured in .env.local
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const validUrl = (supabaseUrl && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your-project-id'))
    ? supabaseUrl
    : 'https://placeholder.supabase.co';

  const validKey = (supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here')
    ? supabaseAnonKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

  cachedClient = createClient(validUrl, validKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}

export const supabase = getSupabaseClient();

