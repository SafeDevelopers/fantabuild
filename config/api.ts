/**
 * API Configuration
 * Centralized configuration for API base URL
 * 
 * In production, VITE_API_BASE_URL MUST be set or the app will fail to start.
 * This prevents accidentally using localhost in production.
 */

// Get API base URL from environment
const getApiBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  // In production, require API URL to be set
  if (isProduction) {
    if (!apiUrl || apiUrl.trim() === '') {
      const error = `
╔══════════════════════════════════════════════════════════════╗
║  CRITICAL ERROR: API Base URL Not Configured                ║
╠══════════════════════════════════════════════════════════════╣
║  VITE_API_BASE_URL environment variable is required in       ║
║  production but was not found.                               ║
║                                                              ║
║  Please set VITE_API_BASE_URL in your CapRover environment  ║
║  variables and rebuild the app.                             ║
║                                                              ║
║  Steps to fix:                                               ║
║  1. Go to CapRover → Your Frontend App → App Configs         ║
║  2. Add: VITE_API_BASE_URL=https://api-staging.addispos.com ║
║  3. Redeploy the app                                         ║
╚══════════════════════════════════════════════════════════════╝
      `;
      console.error(error);
      // Show error in UI as well
      if (typeof document !== 'undefined') {
        document.body.innerHTML = `
          <div style="padding: 40px; font-family: monospace; max-width: 800px; margin: 50px auto; background: #f5f5f5; border: 2px solid #f44336; border-radius: 8px;">
            <h1 style="color: #f44336;">⚠️ Configuration Error</h1>
            <p><strong>VITE_API_BASE_URL</strong> is not configured.</p>
            <p>Please set this environment variable in CapRover and redeploy.</p>
            <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto;">VITE_API_BASE_URL=https://api-staging.addispos.com</pre>
          </div>
        `;
      }
      throw new Error('VITE_API_BASE_URL is required in production but was not set');
    }
    
    // Validate production URL doesn't contain localhost
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      const error = `
╔══════════════════════════════════════════════════════════════╗
║  CRITICAL ERROR: Invalid API URL in Production              ║
╠══════════════════════════════════════════════════════════════╣
║  VITE_API_BASE_URL contains localhost which is not allowed  ║
║  in production.                                             ║
║                                                              ║
║  Current value: ${apiUrl}                                    ║
║                                                              ║
║  Please set a valid production API URL in CapRover.         ║
║  Example: VITE_API_BASE_URL=https://api.yourdomain.com      ║
╚══════════════════════════════════════════════════════════════╝
      `;
      console.error(error);
      throw new Error('VITE_API_BASE_URL cannot contain localhost in production');
    }
    
    return apiUrl;
  }
  
  // In development, fallback to localhost
  return apiUrl || 'http://localhost:3001';
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Log API base URL on startup (visible in browser console)
if (typeof window !== 'undefined') {
  console.log('%c🔗 API Configuration', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Environment:', import.meta.env.MODE);
  console.log('Production:', import.meta.env.PROD);
  
  if (API_BASE_URL.includes('localhost')) {
    console.warn('⚠️  Using localhost API URL. This is only for local development.');
  }
}
