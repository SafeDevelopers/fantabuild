/**
 * @license
 * SPDX-LICense-Identifier: Apache-2.0
*/
import React from 'react';
import { XMarkIcon, CreditCardIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { createOneOffCheckout, createSubscriptionCheckout } from '../services/payments';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
}

export const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({
  isOpen,
  onClose,
  currentCredits,
}) => {
  const [loading, setLoading] = React.useState<'one-off' | 'subscription' | null>(null);

  if (!isOpen) return null;

  const handleBuyCredit = async () => {
    try {
      setLoading('one-off');
      const { url } = await createOneOffCheckout();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      alert(error.message || 'Failed to initiate purchase');
      setLoading(null);
    }
  };

  const handleGoPro = async () => {
    try {
      setLoading('subscription');
      const { url } = await createSubscriptionCheckout();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      alert(error.message || 'Failed to initiate subscription');
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-zinc-100">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-red-500" />
              </div>
              <span className="font-semibold text-lg">Insufficient Credits</span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-zinc-300 mb-4">
              You have <span className="font-bold text-red-400">{currentCredits}</span> credits remaining.
              You need at least 1 credit to download your creation.
            </p>
          </div>

          <div className="space-y-3">
            {/* One-off Purchase Option */}
            <button
              onClick={handleBuyCredit}
              disabled={loading !== null}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading === 'one-off' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CreditCardIcon className="w-5 h-5" />
                  <span>Buy 1 Credit for $3.99</span>
                </>
              )}
            </button>

            {/* Pro Subscription Option */}
            <button
              onClick={handleGoPro}
              disabled={loading !== null}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading === 'subscription' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Go Pro - $29.99/month (40 credits)</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-zinc-600 mt-4">
              <a href="/pricing" className="text-orange-500 hover:text-orange-400 underline">
                View all pricing options
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
