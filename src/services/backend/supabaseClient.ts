import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SupabaseClientOrNull = SupabaseClient | null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Credenciais não encontradas (VITE_SUPABASE_URL/ANON_KEY). Iniciando em modo DEMO (Local).');
}

export const supabase: SupabaseClientOrNull =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const ensureAuth = async () => {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('[Auth] Signing in anonymously...');
    const { error } = await supabase.auth.signInAnonymously();
    if (error) console.error('[Auth] Anonymous sign-in failed:', error);
  }
};

