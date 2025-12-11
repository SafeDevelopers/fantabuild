/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { OnboardingTour } from './components/OnboardingTour';
import { AuthModal } from './components/AuthModal';
import { bringToLife, GenerationMode } from './services/gemini';
import { getCurrentUser, onAuthStateChange, signOut as apiSignOut, AuthUser } from './services/auth-api';
import { getUserData, updateUserSubscription } from './services/user-api';
// Save creation only temporarily for payment processing (not for history)
import { saveCreation } from './services/creations-api';
import { createCheckoutSession, createSubscriptionSession, createOneOffCheckout, createSubscriptionCheckout } from './services/payments';
import { getCreditBalance, CreditBalance } from './services/credits';
import { ArrowUpTrayIcon, QuestionMarkCircleIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const FREE_DAILY_LIMIT = 3;
const PRO_DAILY_LIMIT = 20;

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Auth State
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Usage Tracking
  const [dailyUsage, setDailyUsage] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  // Credit System
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Load example creations (for unauthenticated users or when user has no creations)
  const loadExamples = React.useCallback(async () => {
    try {
      const { API_BASE_URL } = await import('./config/api');
      
      // Asset names (no direct GCS URLs - use backend proxy)
      const assetNames = [
        'vibecode-blog.json',
        'cassette.json',
        'chess.json',
      ];
      
      // Fetch examples via backend proxy (avoids CORS issues)
      const examples = await Promise.all(
        assetNames.map(async (assetName) => {
          try {
            // Use backend proxy endpoint
            const proxyUrl = `${API_BASE_URL}/api/assets/${assetName}`;
            const res = await fetch(proxyUrl);
            
            if (!res.ok) {
              console.warn(`Failed to load ${assetName}: ${res.status} ${res.statusText}`);
              return null;
            }
            
            const data = await res.json();
            return {
              ...data,
              timestamp: new Date(data.timestamp || Date.now()),
              id: data.id || crypto.randomUUID(),
              purchased: false,
            } as Creation;
          } catch (error) {
            // Network error or parsing error - silently skip this example
            console.warn(`Could not load example ${assetName}:`, error);
            return null;
          }
        }),
      );
      
      const validExamples = examples.filter((e): e is Creation => e !== null);
      setHistory(validExamples);
      
      if (validExamples.length === 0) {
        console.info('No examples could be loaded. Check backend logs for asset proxy errors.');
      } else {
        console.log(`✅ Loaded ${validExamples.length} example(s) via backend proxy`);
      }
    } catch (e) {
      console.error('Error loading examples:', e);
      // Don't break the app if examples fail to load
      setHistory([]);
    }
  }, []);

  // Load user data
  const loadUserData = React.useCallback(async (userId: string) => {
    try {
      // Get user data
      const { user: userData, error: userError } = await getUserData(userId);
      if (userError) {
        console.error('Error loading user data:', userError);
        await loadExamples();
        return;
      }

      if (userData) {
        setIsPro(userData.subscription_status === 'pro');
        setDailyUsage(userData.daily_usage_count);
      }

      // Load credit balance
      try {
        const balance = await getCreditBalance();
        setCreditBalance(balance);
        // Update isPro based on plan
        if (balance.plan === 'PRO') {
          setIsPro(true);
        }
      } catch (error) {
        console.error('Error loading credit balance:', error);
      }

      // No database storage - only show examples for new users
      // History is kept in memory only (session-based)
      await loadExamples();
    } catch (error) {
      console.error('Error loading user data:', error);
      await loadExamples();
    }
  }, [loadExamples]);

  // Initialize auth and load data
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoadingAuth(true);

        // 1. Check Onboarding (still use localStorage for this)
        const hasSeenOnboarding = localStorage.getItem(
          'fanta_build_onboarding_completed',
        );
        if (!hasSeenOnboarding) {
          setTimeout(() => setShowOnboarding(true), 1000);
        }

        // 2. Check current auth state
        try {
          const { user: currentUser } = await getCurrentUser();
          setUser(currentUser);

          if (currentUser) {
            // Load user data and history from Supabase
            await loadUserData(currentUser.id);
          } else {
            // Not authenticated - show examples only
            await loadExamples();
          }
        } catch (authError) {
          console.warn('Auth initialization error (Supabase may not be configured):', authError);
          // Continue without auth - show examples
          await loadExamples();
        }

        setIsLoadingAuth(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoadingAuth(false);
        // Still try to load examples
        await loadExamples();
      }
    };

    initApp();

    // Listen for auth state changes (with error handling)
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const authSubscription = onAuthStateChange(async (newUser) => {
        try {
          setUser(newUser);
          if (newUser) {
            await loadUserData(newUser.id);
          } else {
            setHistory([]);
            setIsPro(false);
            setDailyUsage(0);
            setCreditBalance(null);
            await loadExamples();
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        }
      });
      subscription = authSubscription.data?.subscription || null;
    } catch (error) {
      console.warn('Could not set up auth state listener (Supabase may not be configured):', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [loadUserData, loadExamples]);

  // Note: We don't block generation - users can always generate
  // Payment is only required for downloads after free trials
  // limitReached is kept for UI display purposes only
  useEffect(() => {
    const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
    setLimitReached(dailyUsage >= limit);
  }, [dailyUsage, isPro]);

  // Refresh credit balance after payment success
  useEffect(() => {
    const refreshCredits = async () => {
      if (user) {
        try {
          const balance = await getCreditBalance();
          setCreditBalance(balance);
          if (balance.plan === 'PRO') {
            setIsPro(true);
          }
        } catch (error) {
          console.error('Error refreshing credits:', error);
        }
      }
    };

    // Refresh credits when user changes or after a delay (for payment webhooks)
    if (user) {
      refreshCredits();
      // Also refresh after 3 seconds in case webhook is still processing
      const timeout = setTimeout(refreshCredits, 3000);
      return () => clearTimeout(timeout);
    }
  }, [user]);

  // Handle payment success - mark creation as purchased and auto-download
  useEffect(() => {
    const purchasedCreationId = sessionStorage.getItem('purchased_creation_id');
    if (purchasedCreationId && (history.length > 0 || activeCreation)) {
      sessionStorage.removeItem('purchased_creation_id');
      
      // Mark the creation as purchased in memory
      setHistory((prev) => prev.map(c => 
        c.id === purchasedCreationId ? { ...c, purchased: true } : c
      ));
      
      if (activeCreation?.id === purchasedCreationId) {
        setActiveCreation({ ...activeCreation, purchased: true });
        
        // Auto-download after successful payment
        setTimeout(() => {
          if (activeCreation.html) {
            const blob = new Blob([activeCreation.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeCreation.name
              .replace(/[^a-z0-9]/gi, '_')
              .toLowerCase()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 500);
      } else {
        // Check history for the purchased creation
        const purchasedCreation = history.find(c => c.id === purchasedCreationId);
        if (purchasedCreation && purchasedCreation.html) {
          setTimeout(() => {
            const blob = new Blob([purchasedCreation.html!], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${purchasedCreation.name
              .replace(/[^a-z0-9]/gi, '_')
              .toLowerCase()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 500);
        }
      }
    }
  }, [history, activeCreation]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (
    promptText: string,
    file: File | undefined,
    mode: GenerationMode,
  ) => {
    // Require authentication
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Verify token exists
    const token = localStorage.getItem('fanta_build_token');
    if (!token) {
      console.error('No token found, user needs to sign in again');
      setUser(null);
      setShowAuthModal(true);
      return;
    }

    // Note: Users can always generate - no limit on generation
    // Payment is only required for downloads after free trials

    setIsGenerating(true);
    setActiveCreation(null);

    try {
      // All modes (including video) use Gemini API
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      if (file) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type.toLowerCase();
      }

      // Generate using Gemini API (works for all modes including video)
      const html = await bringToLife(promptText, imageBase64, mimeType, mode, user.id);

      // Create creation object in memory only (no database storage)
      // Check if user gets free download: Pro users OR if they have credits
      // For now, all downloads require credits (no free downloads except initial 3 credits)
      const isFreeDownload = false; // All downloads now require credits
      
      const newCreation: Creation = {
        id: crypto.randomUUID(),
        name: file
          ? file.name
          : promptText.slice(0, 20) +
            (promptText.length > 20 ? '...' : '') ||
            `New ${mode} creation`,
        html: html,
        originalImage:
          imageBase64 && mimeType
            ? `data:${mimeType};base64,${imageBase64}`
            : undefined,
        timestamp: new Date(),
        purchased: isFreeDownload, // Free for Pro users or first 3 generations
        mode, // Store mode for payment processing
      };

      setActiveCreation(newCreation);
      // Keep in session memory only (not persisted to database)
      setHistory((prev) => [newCreation, ...prev]);

      // Usage is incremented on backend, refresh user data
      const { user: updatedUser } = await getUserData(user.id);
      if (updatedUser) {
        setDailyUsage(updatedUser.daily_usage_count);
      }
    } catch (error: any) {
      console.error('Failed to generate:', error);
      
      // Check if it's a quota error
      const isQuotaError = error.message?.includes('quota') || error.message?.includes('Quota');
      
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <body style="background:#09090b; color:#f87171; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0;">
            <div style="text-align:center; max-width:600px; padding:40px; border:1px solid #27272a; border-radius:12px; background:#18181b;">
                <h2 style="margin-bottom:10px; color:#ef4444;">${isQuotaError ? 'API Quota Exceeded' : 'System Error'}</h2>
                <p style="color:#a1a1aa; margin-bottom:20px;">
                  ${isQuotaError 
                    ? 'The AI service quota has been exceeded. Please check your Google Cloud billing and quota limits.'
                    : 'The application encountered an unexpected error.'}
                </p>
                ${isQuotaError ? `
                <div style="background:#27272a; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #3f3f46;">
                  <p style="color:#e4e4e7; font-size:14px; margin-bottom:10px;">What to do:</p>
                  <ul style="color:#a1a1aa; font-size:12px; text-align:left; list-style-position:inside;">
                    <li>Check your Google Cloud Console for quota limits</li>
                    <li>Verify your billing is active</li>
                    <li>Request a quota increase if needed</li>
                    <li>Try again later when quota resets</li>
                  </ul>
                  <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" style="color:#f97316; text-decoration:underline; font-size:12px; margin-top:10px; display:inline-block;">Learn more about rate limits</a>
                </div>
                ` : ''}
                <div style="background:#27272a; padding:15px; border-radius:8px; overflow:auto; text-align:left; max-height:200px; margin-bottom:20px; border:1px solid #3f3f46;">
                    <code style="color:#e4e4e7; font-size:12px;">${
                      error.message || String(error)
                    }</code>
                </div>
            </div>
        </body>
        </html>
      `;
      setActiveCreation({
        id: 'error-report',
        name: 'Error Report',
        html: errorHtml,
        timestamp: new Date(),
        purchased: true,
      } as Creation);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleSelectCreation = (creation: Creation) => setActiveCreation(creation);

  const handleDeleteCreation = async (id: string) => {
    if (window.confirm('Delete this creation?')) {
      // Only delete from memory (no database storage)
      setHistory((prev) => prev.filter((c) => c.id !== id));
      if (activeCreation?.id === id) setActiveCreation(null);
    }
  };

  const handleMarkPurchased = (id: string) => {
    // Mark creation as purchased in state
    setHistory((prev) => prev.map(c => c.id === id ? { ...c, purchased: true } : c));
    if (activeCreation?.id === id) {
      setActiveCreation({ ...activeCreation, purchased: true });
    }
  };

  const handleUpgradeToPro = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Create Stripe checkout session for subscription
      const { url } = await createSubscriptionSession(user.id, user.email || undefined);
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        throw new Error('Failed to get checkout URL');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(error.message || 'Failed to initiate upgrade. Please try again.');
    }
  };

  const handlePurchase = async (id: string, plan: 'onetime' | 'subscription') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (plan === 'subscription') {
        // Create Stripe checkout session for Pro subscription ($29.99/month)
        const { url } = await createSubscriptionCheckout();
        if (url) {
          // Redirect to Stripe checkout
          window.location.href = url;
        } else {
          throw new Error('Failed to get checkout URL');
        }
      } else if (plan === 'onetime') {
        // Create Stripe checkout session for one-off credit purchase ($3.99)
        const { url } = await createOneOffCheckout();
        if (url) {
          // Redirect to Stripe checkout
          window.location.href = url;
        } else {
          throw new Error('Failed to get checkout URL');
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to initiate payment. Please try again.');
    }
  };

  const handleImportClick = () => importInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);
        if (parsed.html && parsed.name) {
          const importedCreation: Creation = {
            ...parsed,
            timestamp: new Date(parsed.timestamp || Date.now()),
            id: parsed.id || crypto.randomUUID(),
            purchased: parsed.purchased || false,
          };
          setHistory((prev) => {
            const exists = prev.some((c) => c.id === importedCreation.id);
            return exists ? prev : [importedCreation, ...prev];
          });
          setActiveCreation(importedCreation);
        }
      } catch (err) {
        alert('Failed to import creation.');
      }
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('fanta_build_onboarding_completed', 'true');
  };

  const handleAuthSuccess = async (userData?: AuthUser) => {
    // Update user state after successful login/signup
    try {
      console.log('handleAuthSuccess called with userData:', userData);
      let currentUser = userData;
      
      // If user data not provided, fetch it
      if (!currentUser) {
        console.log('No user data provided, fetching from API...');
        const result = await getCurrentUser();
        if (result.error) {
          console.error('Error getting current user:', result.error);
          return;
        }
        currentUser = result.user;
        console.log('Fetched user from API:', currentUser);
      }
      
      if (currentUser) {
        console.log('Setting user state:', currentUser);
        setUser(currentUser);
        setIsLoadingAuth(false);
        await loadUserData(currentUser.id);
      } else {
        console.log('No user found, clearing state');
        // If no user, clear state
        setUser(null);
        setHistory([]);
        setIsPro(false);
        setDailyUsage(0);
        setCreditBalance(null);
        setIsLoadingAuth(false);
        await loadExamples();
      }
    } catch (error) {
      console.error('Error refreshing user after login:', error);
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await apiSignOut();
      setUser(null);
      setHistory([]);
      setIsPro(false);
      setDailyUsage(0);
      setCreditBalance(null);
      setActiveCreation(null);
      setIsGenerating(false);
      await loadExamples();
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setHistory([]);
      setIsPro(false);
      setDailyUsage(0);
      setCreditBalance(null);
    }
  };

  const handleBuyCredit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const { url } = await createOneOffCheckout();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Error initiating credit purchase:', error);
      alert(error.message || 'Failed to initiate purchase. Please try again.');
    }
  };

  const handleGoPro = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const { url } = await createSubscriptionCheckout();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Error initiating subscription:', error);
      alert(error.message || 'Failed to initiate subscription. Please try again.');
    }
  };

  const isFocused = !!activeCreation || isGenerating;
  const currentLimit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  // Show loading state while initializing
  if (isLoadingAuth) {
    return (
      <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Loading Fanta Build...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#050505] text-zinc-50 selection:bg-orange-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col">
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={handleOnboardingComplete}
        onComplete={handleOnboardingComplete}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      <div className="fixed inset-0 bg-[#050505] z-0"></div>
      <div className="fixed inset-0 bg-tech-grid z-0 opacity-40 pointer-events-none"></div>
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none fanta-glow z-0 mix-blend-screen"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div
        className={`min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${
          isFocused
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden'
            : 'opacity-100 scale-100 blur-0'
        }`}
      >
        {/* Top Right: User Info / Sign In Button - Mobile Optimized */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 md:right-6 z-20 flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 flex-wrap justify-end gap-1.5 sm:gap-2 max-w-[calc(100%-2rem)] sm:max-w-none">
          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap justify-end gap-1.5 sm:gap-2">
              {user.role === 'admin' && (
                <a
                  href="/admin"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all"
                  title="Admin Dashboard"
                >
                  Admin
                </a>
              )}
              {creditBalance !== null && (
                <div className="flex items-center space-x-1 sm:space-x-2 text-zinc-300 text-[10px] sm:text-xs bg-zinc-900/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-zinc-800">
                  <span className="font-mono font-bold whitespace-nowrap">
                    <span className="hidden xs:inline">{creditBalance.credits} {creditBalance.credits === 1 ? 'credit' : 'credits'}</span>
                    <span className="xs:hidden">{creditBalance.credits}</span>
                  </span>
                  {creditBalance.plan === 'PRO' && (
                    <span className="px-1.5 sm:px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-[9px] sm:text-[10px] font-bold">
                      PRO
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-1 sm:space-x-2 text-zinc-300 text-[10px] sm:text-xs bg-zinc-900/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-zinc-800">
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-mono hidden md:inline truncate max-w-[120px]">{user.email}</span>
              </div>
              <a
                href="/pricing"
                className="text-zinc-400 hover:text-orange-500 transition-colors text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 hidden sm:inline"
                title="Pricing"
              >
                Pricing
              </a>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all border border-zinc-800 hover:border-zinc-700"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40"
              title="Sign In"
            >
              Sign In
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full py-6 sm:py-8 md:py-12 lg:py-20">
          <div className="w-full mb-6 sm:mb-8 md:mb-12 lg:mb-16">
            <Hero />
          </div>

          <div className="w-full flex flex-col items-center mb-6 sm:mb-8 px-2 sm:px-0">
            <InputArea
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              disabled={isFocused || limitReached}
            />
            <div className="mt-3 sm:mt-4 flex items-center space-x-2 flex-wrap justify-center gap-2">
              {user && creditBalance !== null ? (
                <div
                  className={`text-xs font-mono px-3 py-1 rounded-full border ${
                    creditBalance.credits <= 0
                      ? 'bg-red-500/10 border-red-500/50 text-red-400'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Credits:{' '}
                  <span
                    className={
                      creditBalance.credits <= 0
                        ? 'text-red-400 font-bold'
                        : 'text-zinc-300'
                    }
                  >
                    {creditBalance.credits}
                  </span>
                  {creditBalance.plan === 'PRO' && (
                    <span className="ml-2 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px] font-bold">
                      PRO
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-xs font-mono px-3 py-1 rounded-full border bg-zinc-900/50 border-zinc-800 text-zinc-500">
                  Credits: <span className="text-zinc-300">-</span>
                </div>
              )}
              {user && (
                <a
                  href="/pricing"
                  className="text-[10px] text-orange-500 hover:text-orange-400 cursor-pointer animate-pulse"
                >
                  Get more credits
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 pb-4 sm:pb-6 w-full mt-auto flex flex-col items-center gap-4 sm:gap-6">
          <div className="w-full px-1 sm:px-2 md:px-0">
            <CreationHistory
              history={history}
              onSelect={handleSelectCreation}
              onDelete={handleDeleteCreation}
            />
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 px-2">
            <p className="text-zinc-700 text-[10px] sm:text-xs font-mono">
              © {new Date().getFullYear()} Fanta Build Inc.
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-zinc-700 hover:text-orange-500 transition-colors"
              title="Replay Tour"
            >
              <QuestionMarkCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 🔒 Only mount LivePreview when needed */}
      {(isGenerating || activeCreation) && (
        <LivePreview
          creation={activeCreation}
          isLoading={isGenerating}
          isFocused={isFocused}
          onReset={handleReset}
          onPurchase={handlePurchase}
          onMarkPurchased={handleMarkPurchased}
        />
      )}

      <div className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-50">
        <button
          onClick={handleImportClick}
          className="flex items-center space-x-1.5 sm:space-x-2 p-1.5 sm:p-2 text-zinc-600 hover:text-zinc-300 transition-colors opacity-60 hover:opacity-100 bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800"
          title="Import Artifact"
        >
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider hidden sm:inline">
            Upload previous artifact
          </span>
          <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <input
          type="file"
          ref={importInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default App;