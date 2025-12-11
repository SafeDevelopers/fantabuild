import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load environment variables from .env files AND from process.env (for Docker build args)
    // CapRover passes env vars as build args, which become process.env variables
    const fileEnv = loadEnv(mode, '.', '');
    const env = {
      ...fileEnv,
      // Override with process.env if available (from Docker build args)
      VITE_API_URL: process.env.VITE_API_URL || fileEnv.VITE_API_URL,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || fileEnv.VITE_API_BASE_URL,
    };
    
    // Warn if API URL is missing in production (but don't fail build)
    // The runtime validation in config/api.ts will catch this when the app loads
    // Support both VITE_API_URL (preferred) and VITE_API_BASE_URL (backward compatibility)
    const apiUrl = env.VITE_API_URL || env.VITE_API_BASE_URL;
    if (mode === 'production' && !apiUrl) {
      console.warn(`
╔══════════════════════════════════════════════════════════════╗
║  WARNING: VITE_API_URL not set during build                 ║
╠══════════════════════════════════════════════════════════════╣
║  The app will fail at runtime if VITE_API_URL is not set     ║
║  in CapRover environment variables.                          ║
║                                                              ║
║  Make sure to set: VITE_API_URL=https://api-staging.addispos.com ║
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
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      }
    };
});
