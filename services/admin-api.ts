/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { getAuthToken } from './auth-api';

import { API_BASE_URL } from '../config/api';

export interface AdminUser {
  id: string;
  email: string;
  subscription_status: 'free' | 'pro';
  role: 'user' | 'admin';
  daily_usage_count: number;
  last_reset_date: string;
  created_at: string;
  creations_count: number;
}

export interface AdminCreation {
  id: string;
  name: string;
  mode: string;
  purchased: boolean;
  created_at: string;
  user_email: string;
  user_id: string;
}

export interface Analytics {
  total_users: number;
  pro_users: number;
  total_creations: number;
  purchased_creations: number;
  total_generations: number;
  new_users_7d: number;
  new_creations_7d: number;
}

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Get analytics
 */
export async function getAnalytics(): Promise<{ data: Analytics | null; error: any }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { data: null, error: 'Authentication required. Please sign in.' };
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return { data: null, error: 'Authentication failed. Please sign in again.' };
      }
      if (response.status === 403) {
        return { data: null, error: 'Admin access required. Your account does not have admin privileges.' };
      }
      return { data: null, error: errorData.error || 'Failed to fetch analytics' };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to fetch analytics' };
  }
}

/**
 * Get all users
 */
export async function getAllUsers(limit = 50, offset = 0): Promise<{ users: AdminUser[]; total: number; error: any }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { users: [], total: 0, error: 'Authentication required. Please sign in.' };
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/users?limit=${limit}&offset=${offset}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return { users: [], total: 0, error: 'Authentication failed. Please sign in again.' };
      }
      if (response.status === 403) {
        return { users: [], total: 0, error: 'Admin access required. Your account does not have admin privileges.' };
      }
      return { users: [], total: 0, error: errorData.error || 'Failed to fetch users' };
    }

    const data = await response.json();
    return { users: data.users, total: data.total, error: null };
  } catch (error: any) {
    return { users: [], total: 0, error: error.message };
  }
}

/**
 * Get all creations
 */
export async function getAllCreations(limit = 50, offset = 0): Promise<{ creations: AdminCreation[]; total: number; error: any }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { creations: [], total: 0, error: 'Authentication required. Please sign in.' };
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/creations?limit=${limit}&offset=${offset}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return { creations: [], total: 0, error: 'Authentication failed. Please sign in again.' };
      }
      if (response.status === 403) {
        return { creations: [], total: 0, error: 'Admin access required. Your account does not have admin privileges.' };
      }
      return { creations: [], total: 0, error: errorData.error || 'Failed to fetch creations' };
    }

    const data = await response.json();
    return { creations: data.creations, total: data.total, error: null };
  } catch (error: any) {
    return { creations: [], total: 0, error: error.message };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<{ error: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to update role' };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(userId: string, status: 'free' | 'pro'): Promise<{ error: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/subscription`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to update subscription' };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<{ error: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to delete user' };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Delete creation
 */
export async function deleteCreation(creationId: string): Promise<{ error: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/creations/${creationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to delete creation' };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

