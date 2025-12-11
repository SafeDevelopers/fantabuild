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
      const errorData = await response.json();
      // Return more detailed error information
      const errorMessage = errorData.error || 'Sign up failed';
      const errorDetails = errorData.details || '';
      return { 
        user: null, 
        error: {
          message: errorMessage,
          details: errorDetails,
        }
      };
    }

    const data: AuthResponse = await response.json();
    // Store token
    localStorage.setItem('fanta_build_token', data.token);
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: { message: error.message || 'Sign up failed' } };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: any }> {
  try {
    console.log('Signing in user:', email);
    console.log('API_BASE_URL:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      console.error('Sign in failed:', errorData);
      // Return more detailed error information
      const errorMessage = errorData.error || 'Sign in failed';
      return { 
        user: null, 
        error: {
          message: errorMessage,
        }
      };
    }

    const data: AuthResponse = await response.json();
    console.log('Sign in successful, user data:', data.user);
    // Store token
    localStorage.setItem('fanta_build_token', data.token);
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      API_BASE_URL
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Sign in failed';
    if (error.message === 'Failed to fetch') {
      errorMessage = `Cannot connect to API at ${API_BASE_URL}. Please check:
1. Backend server is running
2. API URL is correct
3. CORS is configured correctly
4. Network connectivity`;
    }
    
    return { user: null, error: { message: errorMessage } };
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

