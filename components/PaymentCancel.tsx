/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
        <XCircleIcon className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h2>
        <p className="text-zinc-400 mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
        >
          Return to App
        </button>
      </div>
    </div>
  );
};

