/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-900 border border-red-500/50 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-zinc-300 mb-4">
              The application encountered an error. Please check the browser console for details.
            </p>
            {this.state.error && (
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 mb-4">
                <code className="text-xs text-red-400">{this.state.error.toString()}</code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

