import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4321,
    strictPort: true,
    // Proxy /api calls to the Express backend during development so the
    // frontend can use same-origin relative URLs and avoid CORS in dev.
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
      },
    },
  },
});
