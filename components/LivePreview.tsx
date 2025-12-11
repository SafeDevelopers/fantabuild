/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowDownTrayIcon,
  PlusIcon,
  ViewColumnsIcon,
  CodeBracketIcon,
  XMarkIcon,
  LockClosedIcon,
  CreditCardIcon,
  PhotoIcon,
  SparklesIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';
import { requestDownload } from '../services/credits';
import { InsufficientCreditsModal } from './InsufficientCreditsModal';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
  onPurchase?: (id: string, plan: 'onetime' | 'subscription') => void;
  onMarkPurchased?: (id: string) => void;
}

// Add type definition for the global pdfjsLib and html2canvas
declare global {
  interface Window {
    pdfjsLib: any;
    html2canvas: any;
  }
}

const LoadingStep = ({
  text,
  active,
  completed,
}: {
  text: string;
  active: boolean;
  completed: boolean;
}) => (
  <div
    className={`flex items-center space-x-3 transition-all duration-500 ${
      active || completed
        ? 'opacity-100 translate-x-0'
        : 'opacity-30 translate-x-4'
    }`}
  >
    <div
      className={`w-4 h-4 flex items-center justify-center ${
        completed
          ? 'text-green-400'
          : active
          ? 'text-orange-400'
          : 'text-zinc-700'
      }`}
    >
      {completed ? (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : active ? (
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
      ) : (
        <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
      )}
    </div>
    <span
      className={`font-mono text-xs tracking-wide uppercase ${
        active
          ? 'text-zinc-200'
          : completed
          ? 'text-zinc-400 line-through'
          : 'text-zinc-600'
      }`}
    >
      {text}
    </span>
  </div>
);

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        // Graceful fallback if lib isn't loaded
        setError('PDF Preview unavailable');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');

        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        setError('Could not render PDF preview.');
        setLoading(false);
      }
    };

    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
        <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
        <p className="text-sm mb-2 text-red-400/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0c0c0e]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded transition-opacity duration-500 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};

// Payment Modal Component
const PurchaseModal = ({
  isOpen,
  onClose,
  onConfirm,
  oneTimePrice,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (plan: 'onetime' | 'subscription') => void;
  oneTimePrice: string;
}) => {
  const [selectedPlan, setSelectedPlan] =
    useState<'onetime' | 'subscription'>('subscription');

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-zinc-100">
              <div className="bg-orange-500/10 p-2 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-orange-500" />
              </div>
              <span className="font-semibold text-lg">Unlock Fanta Build</span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {/* Subscription Option (Best Value) */}
            <div
              onClick={() => setSelectedPlan('subscription')}
              className={`
                                relative rounded-xl p-4 border flex justify-between items-center group cursor-pointer transition-all
                                ${
                                  selectedPlan === 'subscription'
                                    ? 'bg-zinc-800/50 border-orange-500/50 ring-1 ring-orange-500/50 shadow-lg shadow-orange-900/10'
                                    : 'bg-zinc-950/30 border-zinc-800/50 hover:bg-zinc-900'
                                }
                            `}
            >
              {selectedPlan === 'subscription' && (
                <div className="absolute -top-2.5 right-4 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  RECOMMENDED
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'subscription'
                      ? 'border-orange-500'
                      : 'border-zinc-600'
                  }`}
                >
                  {selectedPlan === 'subscription' && (
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  )}
                </div>
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      selectedPlan === 'subscription'
                        ? 'text-white'
                        : 'text-zinc-300'
                    }`}
                  >
                    Pro Subscription
                  </h4>
                  <p className="text-xs text-zinc-500">
                    40 credits/month + Faster generation
                  </p>
                </div>
              </div>
              <span
                className={`${
                  selectedPlan === 'subscription'
                    ? 'text-white'
                    : 'text-zinc-400'
                } font-mono font-bold text-sm`}
              >
                $29.99
                <span className="text-xs font-normal text-zinc-500">/mo</span>
              </span>
            </div>

            {/* One-Time Option */}
            <div
              onClick={() => setSelectedPlan('onetime')}
              className={`
                                rounded-xl p-4 border flex justify-between items-center group cursor-pointer transition-all
                                ${
                                  selectedPlan === 'onetime'
                                    ? 'bg-zinc-800/50 border-orange-500/50 ring-1 ring-orange-500/50 shadow-lg shadow-orange-900/10'
                                    : 'bg-zinc-950/30 border-zinc-800/50 hover:bg-zinc-900'
                                }
                            `}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'onetime'
                      ? 'border-orange-500'
                      : 'border-zinc-600'
                  }`}
                >
                  {selectedPlan === 'onetime' && (
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  )}
                </div>
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      selectedPlan === 'onetime'
                        ? 'text-white'
                        : 'text-zinc-300'
                    }`}
                  >
                    Buy 1 Credit
                  </h4>
                  <p className="text-xs text-zinc-500">
                    1 credit = 1 download
                  </p>
                </div>
              </div>
              <span
                className={`${
                  selectedPlan === 'onetime'
                    ? 'text-white'
                    : 'text-zinc-400'
                } font-mono font-bold`}
              >
                {oneTimePrice}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onConfirm(selectedPlan)}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center space-x-2"
            >
              {selectedPlan === 'subscription' ? (
                <SparklesIcon className="w-4 h-4" />
              ) : (
                <LockClosedIcon className="w-4 h-4" />
              )}
              <span>
                  {selectedPlan === 'subscription'
                    ? 'Go Pro - $29.99/month'
                    : `Buy Credit - ${oneTimePrice}`}
              </span>
            </button>
            <p className="text-center text-[10px] text-zinc-600">
              {selectedPlan === 'subscription'
                ? '40 credits/month. Faster generation. Cancel anytime.'
                : '1 credit = 1 download. Non-refundable.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({
  creation,
  isLoading,
  isFocused,
  onReset,
  onPurchase,
  onMarkPurchased,
}) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [showSplitView, setShowSplitView] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle loading animation steps
  useEffect(() => {
    if (isLoading) {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [isLoading]);

  // Default to Split View when a new creation with an image is loaded
  useEffect(() => {
    if (creation?.originalImage) {
      setShowSplitView(true);
    } else {
      setShowSplitView(false);
    }
  }, [creation]);

  const handleDownloadHtml = () => {
    if (!creation || !creation.html) return;
    const blob = new Blob([creation.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${creation.name
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async () => {
    if (!creation) return;
    setIsExportingPng(true);

    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) {
        console.error('Iframe not found or not accessible');
        return;
      }

      if (!window.html2canvas) {
        console.error('html2canvas library not loaded');
        alert('Screenshot tool not loaded. Please refresh.');
        return;
      }

      // Capture the iframe body
      const canvas = await window.html2canvas(iframe.contentDocument.body, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure white background if transparent
      });

      const link = document.createElement('a');
      link.download = `${creation.name
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}_preview.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('PNG Export Failed:', error);
      alert('Could not generate PNG. The layout might be too complex.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportClick = async () => {
    if (!creation) return;

    // If already purchased, download immediately
    if (creation.purchased) {
      handleDownloadHtml();
      return;
    }

    // Try to consume credit for download
    try {
      setIsExporting(true);
      const result = await requestDownload(creation.id);
      
      // Credit consumed successfully, mark as purchased in parent component
      if (onMarkPurchased) {
        onMarkPurchased(creation.id);
      }
      
      // Trigger download
      setTimeout(() => {
        handleDownloadHtml();
        setIsExporting(false);
      }, 100);
    } catch (error: any) {
      setIsExporting(false);
      if (error.code === 'INSUFFICIENT_CREDITS') {
        // Show insufficient credits modal
        setCurrentCredits(error.credits || 0);
        setShowInsufficientCredits(true);
      } else {
        console.error('Download error:', error);
        alert(error.message || 'Failed to process download. Please try again.');
      }
    }
  };

  const handleConfirmPurchase = async (plan: 'onetime' | 'subscription') => {
    setIsExporting(true);
    try {
      if (creation && onPurchase) {
        await onPurchase(creation.id, plan);
      }
      setIsExporting(false);
      setShowPurchaseModal(false);
      // Note: Download will happen after payment success redirect
    } catch (error: any) {
      console.error('Purchase error:', error);
      setIsExporting(false);
      alert(error.message || 'Failed to process purchase. Please try again.');
    }
  };

  // 🔒 IMPORTANT: avoid showing the preview overlay when nothing is happening
  if (!isFocused && !isLoading && !creation) {
    return null;
  }

  // Decide if we have HTML to show (allow empty string as valid)
  // Video mode also uses HTML (animated HTML/CSS), so we check html for all modes
  const hasHtml =
    !!creation && creation.html !== undefined && creation.html !== null;

  return (
    <div
      className={`
        fixed z-[1000] flex flex-col
        rounded-lg sm:rounded-xl overflow-hidden border border-zinc-800 bg-[#0E0E10] shadow-2xl
        transition-all duration-500 ease-in-out
        ${
          isFocused
            ? 'top-0 bottom-0 left-0 right-0 sm:top-1 sm:bottom-1 sm:left-1 sm:right-1 md:top-2 md:bottom-2 md:left-2 md:right-2 lg:top-4 lg:bottom-4 lg:left-4 lg:right-4 opacity-100 scale-100 pointer-events-auto rounded-none sm:rounded-lg'
            : 'top-1/2 left-1/2 w-[95%] sm:w-[90%] h-[70%] sm:h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Paywall Modal Overlay */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onConfirm={handleConfirmPurchase}
        oneTimePrice="$3.99"
      />

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
        currentCredits={currentCredits}
      />

      {/* Minimal Technical Header - Mobile Optimized */}
      <div className="bg-[#121214] px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 flex items-center justify-between border-b border-zinc-800 shrink-0 min-h-[48px] sm:h-[52px]">
        {/* Left: Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <div className="flex space-x-1.5 sm:space-x-2 group/controls">
            <button
              onClick={onReset}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-700 group-hover/controls:bg-red-500 hover:!bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
              title="Close Preview"
            >
              <XMarkIcon className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-black opacity-0 group-hover/controls:opacity-100" />
            </button>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-700 group-hover/controls:bg-yellow-500 transition-colors"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-700 group-hover/controls:bg-green-500 transition-colors"></div>
          </div>
        </div>

        {/* Center: Title */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-zinc-500 flex-1 min-w-0 px-1 sm:px-2">
          <CodeBracketIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider truncate">
            {isLoading
              ? 'Processing...'
              : creation
              ? creation.name
              : 'Preview'}
          </span>
        </div>

        {/* Right: Actions - Mobile Optimized */}
        <div className="flex items-center justify-end space-x-1 sm:space-x-2 flex-shrink-0">
          {!isLoading && creation && (
            <>
              {creation.originalImage && (
                <button
                  onClick={() => setShowSplitView(!showSplitView)}
                  title={
                    showSplitView ? 'Show App Only' : 'Compare with Original'
                  }
                  className={`p-1 sm:p-1.5 rounded-md transition-all ${
                    showSplitView
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <ViewColumnsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {/* PNG Export Button */}
              <button
                onClick={handleExportPng}
                disabled={isExportingPng}
                className="p-1 sm:p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
                title="Export Screenshot (PNG)"
              >
                {isExportingPng ? (
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin"></div>
                ) : (
                  <PhotoIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>

              {/* Download/Purchase Button - Mobile Optimized */}
              <button
                onClick={handleExportClick}
                disabled={isExporting}
                className={`
                            flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all
                            ${
                              creation.purchased
                                ? 'bg-zinc-800 text-green-400 hover:bg-zinc-700'
                                : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20'
                            }
                        `}
              >
                {isExporting ? (
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : creation.purchased ? (
                  <>
                    <ArrowDownTrayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Download HTML</span>
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="text-[10px] sm:text-xs">Get Code</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 w-full bg-[#09090b] overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full h-full z-20">
            {/* Technical Loading State */}
            <div className="w-full max-w-md space-y-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 mb-6 text-orange-500 animate-spin-slow">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-zinc-100 font-mono text-lg tracking-tight">
                  Fanta Build is Thinking...
                </h3>
                <p className="text-zinc-500 text-sm mt-2">
                  Interpreting visual data...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 animate-[loading_3s_ease-in-out_infinite] w-1/3"></div>
              </div>

              {/* Terminal Steps */}
              <div className="border border-zinc-800 bg-black/50 rounded-lg p-4 space-y-3 font-mono text-sm">
                <LoadingStep
                  text="Analyzing visual inputs"
                  active={loadingStep === 0}
                  completed={loadingStep > 0}
                />
                <LoadingStep
                  text="Identifying UI patterns"
                  active={loadingStep === 1}
                  completed={loadingStep > 1}
                />
                <LoadingStep
                  text="Generating functional logic"
                  active={loadingStep === 2}
                  completed={loadingStep > 2}
                />
                <LoadingStep
                  text="Compiling preview"
                  active={loadingStep === 3}
                  completed={loadingStep > 3}
                />
              </div>
            </div>
          </div>
        ) : hasHtml ? (
          <div className="absolute inset-0 flex flex-col md:flex-row">
            {/* Split View: Left Panel (Original Image) */}
            {showSplitView && creation?.originalImage && (
              <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] relative flex flex-col shrink-0">
                <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-800">
                  Input Source
                </div>
                <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
                  {creation.originalImage.startsWith('data:application/pdf') ? (
                    <PdfRenderer dataUrl={creation.originalImage} />
                  ) : (
                    <img
                      src={creation.originalImage}
                      alt="Original Input"
                      className="max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded"
                    />
                  )}
                </div>
              </div>
            )}

            {/* App Preview Panel */}
            <div
              className={`relative h-full bg-white transition-all duration-500 ${
                showSplitView && creation?.originalImage
                  ? 'w-full md:w-1/2 h-1/2 md:h-full'
                  : 'w-full'
              }`}
            >
              {!creation?.purchased && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 z-10 pointer-events-none"></div>
              )}

              <iframe
                ref={iframeRef}
                title="Gemini Live Preview"
                srcDoc={creation?.html ?? ''}
                className="w-full h-full bg-white block"
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
              />
            </div>
          </div>
        ) : (
          // Fallback: overlay open but no HTML – show message instead of pure black
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-500 text-sm">
              <p>No preview available yet.</p>
              <p className="text-zinc-600 mt-1">
                Try generating a new design to see the live preview.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};