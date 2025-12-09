/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { getAuthToken } from './auth-api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface CreditBalance {
  credits: number;
  plan: 'FREE' | 'PAY_PER_USE' | 'PRO';
  proUntil?: string | null;
}

export interface CreditTransaction {
  id: string;
  change: number;
  reason: 'INITIAL_FREE' | 'DOWNLOAD' | 'ONE_OFF_PURCHASE' | 'SUBSCRIPTION_MONTHLY';
  created_at: string;
}

/**
 * Get current credit balance
 */
export async function getCreditBalance(): Promise<CreditBalance> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/credits/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get credit balance');
  }

  return response.json();
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(limit = 50): Promise<{ transactions: CreditTransaction[] }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/credits/history?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get credit history');
  }

  return response.json();
}

/**
 * Request download (consumes 1 credit)
 */
export async function requestDownload(creationId: string): Promise<{ success: boolean; creditsRemaining: number; creation?: any }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ creationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 402 && error.error === 'INSUFFICIENT_CREDITS') {
      const insufficientCreditsError: any = new Error(error.message || 'Insufficient credits');
      insufficientCreditsError.code = 'INSUFFICIENT_CREDITS';
      insufficientCreditsError.credits = error.credits || 0;
      throw insufficientCreditsError;
    }
    throw new Error(error.error || error.message || 'Failed to process download');
  }

  return response.json();
}
