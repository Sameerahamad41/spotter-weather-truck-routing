import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Use explicit IPv4 127.0.0.1 to avoid Windows Node IPv6 (::1) ECONNREFUSED mismatch
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('[Vite Proxy Warning]: Could not connect to Django backend at http://127.0.0.1:8000. Ensure "python manage.py runserver" is running.');
          });
        },
      },
    },
  },
});
