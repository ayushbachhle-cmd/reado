import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Indicates whether Supabase credentials have been configured in .env
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl.trim().length > 0 &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey.trim().length > 0 &&
    supabaseAnonKey !== 'your-anon-publishable-key-here'
);

// Provide safe fallback placeholders so createClient does not throw on startup when credentials are empty
const clientUrl = isSupabaseConfigured ? supabaseUrl.trim() : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? supabaseAnonKey.trim() : 'placeholder-anon-key';

/**
 * Initialized Supabase client configured for Expo / React Native
 * Uses AsyncStorage for session persistence and handles auth refreshes.
 * STRICT SECURITY: Anon publishable key only. Never service_role key.
 */
export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export { supabaseUrl };

