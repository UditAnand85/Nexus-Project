import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://35.154.85.147:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // Rewrite origin to localhost:3000 so the backend accepts it
            proxyReq.setHeader('origin', 'http://localhost:3000');
          });
        }
      },
      '/health': {
        target: 'http://35.154.85.147:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('origin', 'http://localhost:3000');
          });
        }
      }
    }
  }
})
