/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { getAuthToken } from './auth-api';

import { API_BASE_URL } from '../config/api';

/**
 * Create a Stripe checkout session for one-time purchase
 */
export async function createCheckoutSession(
  userId: string,
  creationId: string,
  userEmail?: string
): Promise<{ sessionId: string; url: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      creationId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Create a Stripe checkout session for one-off credit purchase ($3.99)
 */
export async function createOneOffCheckout(): Promise<{ sessionId: string; url: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/billing/checkout/one-off`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Create a Stripe checkout session for Pro subscription ($29.99/month)
 */
export async function createSubscriptionCheckout(): Promise<{ sessionId: string; url: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/billing/checkout/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create subscription session');
  }

  return response.json();
}

/**
 * Create a Stripe checkout session for Pro subscription (Legacy endpoint - for backward compatibility)
 */
export async function createSubscriptionSession(
  userId: string,
  userEmail?: string
): Promise<{ sessionId: string; url: string }> {
  return createSubscriptionCheckout();
}

/**
 * Get available payment gateways
 */
export async function getPaymentGateways(): Promise<Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  currency: string;
}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/gateways`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.gateways || [];
  } catch (error) {
    console.error('Error getting payment gateways:', error);
    return [];
  }
}

/**
 * Create payment session for Ethiopian payment methods (TeleBirr, CBE, etc.)
 */
export async function createEthiopianPaymentSession(
  gateway: string,
  amount: number,
  currency: string,
  creationId: string | null,
  type: 'onetime' | 'subscription',
  phone?: string
): Promise<{ paymentUrl: string; orderId: string }> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      gateway,
      amount,
      currency,
      creationId,
      type,
      phone,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment session');
  }

  const data = await response.json();
  return {
    paymentUrl: data.paymentUrl,
    orderId: data.orderId,
  };
}

/**
 * Verify payment status (check if session was completed)
 */
export async function verifyPaymentStatus(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-payment?session_id=${sessionId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.paid === true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

