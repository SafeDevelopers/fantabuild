/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { supabase, DatabaseUser } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: any }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { user: null, error };
  }

  // Create user record in database if signup successful
  if (data.user) {
    await createUserRecord(data.user.id, email);
  }

  return { user: data.user, error: null };
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, error };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: any }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: any }> {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  try {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return { data };
  } catch (error) {
    console.warn('Auth state change listener error:', error);
    // Return a dummy subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }
}

/**
 * Create a user record in the database
 */
async function createUserRecord(userId: string, email: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      subscription_status: 'free',
      daily_usage_count: 0,
      last_reset_date: today,
    });

  if (error) {
    console.error('Error creating user record:', error);
  }
}

/**
 * Get user data from database
 */
export async function getUserData(userId: string): Promise<{ user: DatabaseUser | null; error: any }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { user: data, error };
}

/**
 * Update user subscription status
 */
export async function updateUserSubscription(
  userId: string,
  status: 'free' | 'pro'
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('users')
    .update({ subscription_status: status })
    .eq('id', userId);

  return { error };
}

/**
 * Reset daily usage if it's a new day
 */
export async function resetDailyUsageIfNeeded(userId: string): Promise<{ error: any }> {
  const { data: user, error: fetchError } = await getUserData(userId);
  
  if (fetchError || !user) {
    return { error: fetchError };
  }

  const today = new Date().toISOString().split('T')[0];
  
  if (user.last_reset_date !== today) {
    const { error } = await supabase
      .from('users')
      .update({
        daily_usage_count: 0,
        last_reset_date: today,
      })
      .eq('id', userId);

    return { error };
  }

  return { error: null };
}

/**
 * Increment daily usage count
 */
export async function incrementDailyUsage(userId: string): Promise<{ error: any }> {
  // First check if we need to reset
  await resetDailyUsageIfNeeded(userId);

  // Then increment
  const { error } = await supabase.rpc('increment_daily_usage', {
    user_id: userId,
  });

  // If RPC doesn't exist, do it manually
  if (error && error.message.includes('function') && error.message.includes('does not exist')) {
    const { data: user } = await getUserData(userId);
    if (user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ daily_usage_count: user.daily_usage_count + 1 })
        .eq('id', userId);
      return { error: updateError };
    }
  }

  return { error };
}

