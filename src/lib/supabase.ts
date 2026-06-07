// Capture password-recovery intent from the URL hash before detectSessionInUrl runs.
import '@/lib/passwordRecovery';

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced early so a missing .env is obvious during development.
  console.warn(
    '[tomora] Missing Supabase env vars. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // Web uses localStorage by default; native uses AsyncStorage.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // PKCE requires the code verifier in the same browser that started sign-up. Email
    // verification links often open elsewhere (mail apps, another device), so web uses
    // implicit flow — tokens arrive in the URL hash and need no stored verifier.
    flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
