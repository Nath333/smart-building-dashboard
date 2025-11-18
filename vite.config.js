import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/smart-building-dashboard/',
  build: {
    // Optimize build output
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for production debugging
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'], // Only drop log and debug
      },
    },
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
        },
      },
    },
    // Source maps for debugging
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },
})
