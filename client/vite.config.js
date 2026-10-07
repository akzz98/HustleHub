import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://localhost:3000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      // Proxy /api → HTTPS API so the browser avoids CORS and self-signed cert issues in dev.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false, // local self-signed TLS
        },
      },
    },
  };
});
