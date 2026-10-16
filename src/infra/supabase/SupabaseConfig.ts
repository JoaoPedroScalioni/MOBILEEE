export interface SupabaseConfig {
  url: string;
  anonKey: string;
  storageBucket: string;
}

export const defaultSupabaseConfig: SupabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-anon-key',
  storageBucket: process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'recibos',
};
