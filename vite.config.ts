import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Validate API URL in production build
    if (mode === 'production' && !env.VITE_API_BASE_URL) {
      throw new Error(`
╔══════════════════════════════════════════════════════════════╗
║  BUILD ERROR: VITE_API_BASE_URL is required in production   ║
╠══════════════════════════════════════════════════════════════╣
║  Please set VITE_API_BASE_URL environment variable before   ║
║  building for production.                                    ║
║                                                              ║
║  Example: VITE_API_BASE_URL=https://api.yourdomain.com       ║
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
