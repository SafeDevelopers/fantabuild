/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Creation } from '../components/CreationHistory';
import { GenerationMode } from './gemini';
import { getAuthToken } from './auth-api';

import { API_BASE_URL } from '../config/api';

/**
 * Fetch all creations for a user
 */
export async function fetchUserCreations(userId: string): Promise<{ creations: Creation[]; error: any }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/creations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return { creations: [], error: 'Failed to fetch creations' };
    }

    const data = await response.json();
    const creations = (data.creations || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      html: item.html,
      originalImage: item.original_image,
      timestamp: new Date(item.created_at),
      purchased: item.purchased,
    }));

    return { creations, error: null };
  } catch (error: any) {
    return { creations: [], error: error.message };
  }
}

/**
 * Save a new creation
 */
export async function saveCreation(
  userId: string,
  creation: Omit<Creation, 'id' | 'timestamp'>,
  mode: GenerationMode
): Promise<{ creation: Creation | null; error: any }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/creations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        name: creation.name,
        html: creation.html,
        original_image: creation.originalImage,
        mode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { creation: null, error: error.error || 'Failed to save creation' };
    }

    const data = await response.json();
    const newCreation: Creation = {
      id: data.id,
      name: data.name,
      html: data.html,
      originalImage: data.original_image,
      timestamp: new Date(data.created_at),
      purchased: data.purchased,
    };

    return { creation: newCreation, error: null };
  } catch (error: any) {
    return { creation: null, error: error.message };
  }
}

/**
 * Delete a creation
 */
export async function deleteCreation(creationId: string): Promise<{ error: any }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/creations/${creationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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

/**
 * Mark a creation as purchased
 */
export async function markCreationAsPurchased(creationId: string): Promise<{ error: any }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/creations/${creationId}/purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to mark as purchased' };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

