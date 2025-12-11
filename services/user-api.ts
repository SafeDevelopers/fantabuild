/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { getAuthToken } from './auth-api';

import { API_BASE_URL } from '../config/api';

export interface DatabaseUser {
  id: string;
  email: string;
  subscription_status: 'free' | 'pro';
  daily_usage_count: number;
  last_reset_date: string;
}

/**
 * Get user data from database
 */
export async function getUserData(userId: string): Promise<{ user: DatabaseUser | null; error: any }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return { user: null, error: 'Failed to get user data' };
    }

    const user = await response.json();
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

/**
 * Update user subscription status
 */
export async function updateUserSubscription(
  userId: string,
  status: 'free' | 'pro'
): Promise<{ error: any }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/users/subscription`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
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

