import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Warn if API URL is missing in production (but don't fail build)
    // The runtime validation in config/api.ts will catch this when the app loads
    if (mode === 'production' && !env.VITE_API_BASE_URL) {
      console.warn(`
╔══════════════════════════════════════════════════════════════╗
║  WARNING: VITE_API_BASE_URL not set during build            ║
╠══════════════════════════════════════════════════════════════╣
║  The app will fail at runtime if VITE_API_BASE_URL is not     ║
║  set in CapRover environment variables.                      ║
║                                                              ║
║  Make sure to set: VITE_API_BASE_URL=https://api.yourdomain.com ║
║  in CapRover before deploying.                               ║
╚══════════════════════════════════════════════════════════════╝
      `);
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Note: Gemini API key is now on the backend, not needed in frontend
      envPrefix: 'VITE_',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Ensure environment variables are available at build time
      define: {
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      }
    };
});
