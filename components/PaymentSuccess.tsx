/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentUser, getUserData } from '../services/auth-api';
import { getUserData as getUserDataAPI } from '../services/user-api';
import { getCreditBalance } from '../services/credits';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id'); // PayPal uses order_id
  const gateway = searchParams.get('gateway'); // Payment gateway (stripe, paypal, etc.)
  const creationId = searchParams.get('creation_id');
  const type = searchParams.get('type');

  useEffect(() => {
    const processPayment = async () => {
      try {
        setLoading(true);

        // Get current user
        const { user } = await getCurrentUser();
        if (!user) {
          setError('User not authenticated');
          return;
        }

        // Handle PayPal payments (need to capture the order)
        if (gateway === 'paypal' && orderId) {
          const token = localStorage.getItem('fanta_build_token');
          const { API_BASE_URL } = await import('../config/api');
          
          const captureResponse = await fetch(`${API_BASE_URL}/api/payment/paypal/capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ orderId }),
          });

          if (!captureResponse.ok) {
            const errorData = await captureResponse.json();
            throw new Error(errorData.error || 'Failed to capture PayPal payment');
          }

          const captureData = await captureResponse.json();
          
          if (captureData.type === 'subscription') {
            // Refresh user data to get updated subscription status
            const { user: userData } = await getUserDataAPI(user.id);
            if (userData?.subscription_status === 'pro') {
              setTimeout(() => navigate('/'), 2000);
            } else {
              setError('Payment processed but subscription not activated. Please contact support.');
            }
          } else if (captureData.creationId) {
            // Store creationId in sessionStorage so App.tsx can update it
            sessionStorage.setItem('purchased_creation_id', captureData.creationId);
            setTimeout(() => navigate('/'), 2000);
          }
          return;
        }

        // Handle Stripe payments (webhook-based)
        if (sessionId) {
          // Wait a moment for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));

        if (type === 'subscription') {
          // Refresh credit balance to get updated plan and credits
          const balance = await getCreditBalance();
          if (balance.plan === 'PRO' && balance.credits >= 40) {
            // Success - redirect to app
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            // Webhook might not have processed yet, wait a bit more
            setTimeout(async () => {
              const retryBalance = await getCreditBalance();
              if (retryBalance.plan === 'PRO') {
                navigate('/');
              } else {
                setError('Payment processed but subscription not activated. Please contact support.');
              }
            }, 3000);
          }
        } else if (type === 'one-off') {
          // Refresh credit balance for one-off purchase
          const balance = await getCreditBalance();
          if (balance.credits > 0) {
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            setError('Payment processed but credits not added. Please contact support.');
          }
        } else if (creationId) {
            // For one-time purchases, payment is processed via webhook
            // The creation in the database is marked as purchased
            // We'll update the in-memory creation when user returns to the app
            // Store creationId in sessionStorage so App.tsx can update it
            sessionStorage.setItem('purchased_creation_id', creationId);
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        }
      } catch (err: any) {
        console.error('Payment processing error:', err);
        setError(err.message || 'Failed to process payment');
      } finally {
        setLoading(false);
      }
    };

    // Handle both Stripe (session_id) and PayPal (order_id) redirects
    if (sessionId || orderId) {
      processPayment();
    } else {
      setError('Invalid payment session');
      setLoading(false);
    }
  }, [sessionId, orderId, creationId, type, navigate]);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Payment Error</h2>
          <p className="text-zinc-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-green-500/50 rounded-lg p-6 text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
        <p className="text-zinc-400 mb-6">
          {type === 'subscription'
            ? 'Your Pro subscription is now active with 40 credits. Redirecting...'
            : type === 'one-off'
            ? '1 credit has been added to your account. Redirecting...'
            : 'Your purchase is complete. Redirecting...'}
        </p>
        <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

