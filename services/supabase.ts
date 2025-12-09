/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a dummy client if env vars are missing to prevent crashes
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  // Create a client with dummy values - it will fail gracefully on actual operations
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Database Types
export interface DatabaseUser {
  id: string;
  email: string;
  subscription_status: 'free' | 'pro';
  daily_usage_count: number;
  last_reset_date: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface DatabaseCreation {
  id: string;
  user_id: string;
  name: string;
  html: string;
  original_image?: string; // Base64 data URL
  mode: 'web' | 'mobile' | 'social' | 'logo';
  purchased: boolean;
  created_at: string;
  updated_at: string;
}

