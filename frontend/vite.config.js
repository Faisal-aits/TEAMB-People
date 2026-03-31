import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the origin header
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
        }
      }
    }
  },
  // Add this to handle absolute URLs
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})