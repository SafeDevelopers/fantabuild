/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  subscription_status: 'free' | 'pro';
  role?: 'user' | 'admin';
  daily_usage_count?: number;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { user: null, error: error.error || 'Sign up failed' };
    }

    const data: AuthResponse = await response.json();
    // Store token
    localStorage.setItem('fanta_build_token', data.token);
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Sign up failed' };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { user: null, error: error.error || 'Sign in failed' };
    }

    const data: AuthResponse = await response.json();
    // Store token
    localStorage.setItem('fanta_build_token', data.token);
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Sign in failed' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: any }> {
  localStorage.removeItem('fanta_build_token');
  return { error: null };
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<{ user: AuthUser | null; error: any }> {
  try {
    const token = localStorage.getItem('fanta_build_token');
    if (!token) {
      return { user: null, error: null };
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // Token invalid, clear it
      localStorage.removeItem('fanta_build_token');
      return { user: null, error: null };
    }

    const user: AuthUser = await response.json();
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

/**
 * Listen to auth state changes (simplified - just check token)
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  // Check immediately
  getCurrentUser().then(({ user }) => callback(user));

  // Listen for storage changes (e.g., from other tabs)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'fanta_build_token') {
      getCurrentUser().then(({ user }) => callback(user));
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Return unsubscribe function
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          window.removeEventListener('storage', handleStorageChange);
        },
      },
    },
  };
}

/**
 * Get auth token for API calls
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('fanta_build_token');
}

