/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { CheckIcon, SparklesIcon, BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createOneOffCheckout, createSubscriptionCheckout } from '../services/payments';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'one-off' | 'subscription' | null>(null);

  const handleOneOffPurchase = async () => {
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

  const handleSubscriptionPurchase = async () => {
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

  const handleStartFree = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Start free, pay as you go, or unlock unlimited with Pro
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-zinc-400 ml-2">/forever</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">3 AI credits on signup</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">All generators available</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Web App, Mobile UI, TikTok/Reels</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Logo & Brand, AI Video</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Standard generation speed</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Watermark included</span>
              </li>
            </ul>
            <button
              onClick={handleStartFree}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all"
            >
              Start for free
            </button>
          </div>

          {/* Pay-per-download Plan */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Pay-per-download</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">$3.99</span>
                <span className="text-zinc-400 ml-2">/credit</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">1 credit = 1 download</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Pay only when you download</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">No subscription required</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">All generators available</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Standard generation speed</span>
              </li>
            </ul>
            <button
              onClick={handleOneOffPurchase}
              disabled={loading === 'one-off'}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading === 'one-off' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Buy a credit'
              )}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 border-2 border-orange-500/50 rounded-2xl p-8 flex flex-col relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-sm font-bold px-4 py-1 rounded-full">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                Pro
                <SparklesIcon className="w-5 h-5 text-orange-500 ml-2" />
              </h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">$29.99</span>
                <span className="text-zinc-400 ml-2">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 font-medium">40 credits monthly</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 font-medium">Faster generation</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 font-medium">No watermark</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 font-medium">Commercial license</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 font-medium">Pro templates</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300 font-medium">All generators</span>
              </li>
            </ul>
            <button
              onClick={handleSubscriptionPurchase}
              disabled={loading === 'subscription'}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading === 'subscription' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Go Pro
                </>
              )}
            </button>
          </div>
        </div>

        {/* Why Upgrade Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Upgrade?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BoltIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Faster Generation</h3>
              <p className="text-zinc-400">
                Pro users get priority processing for faster AI generation results.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Commercial License</h3>
              <p className="text-zinc-400">
                Use generated content commercially without restrictions or watermarks.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro Templates</h3>
              <p className="text-zinc-400">
                Access exclusive Pro templates and advanced generation options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
