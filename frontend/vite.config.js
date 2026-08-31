import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', 
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the origin header
            proxyReq.setHeader('Origin', 'http://localhost:5175');
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
