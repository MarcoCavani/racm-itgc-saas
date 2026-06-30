import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@stripe/stripe-js')) return 'stripe'
          if (id.includes('@supabase/supabase-js')) return 'supabase'
        }
      }
    }
  }
})
