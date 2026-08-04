import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy proof server requests to avoid CORS when running locally.
      // Usage in code: fetch('/proof-server/prove') → proxied to http://localhost:6300/prove
      '/proof-server': {
        target: 'http://localhost:6300',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proof-server/, ''),
      },
      // Proxy Midnight Preview indexer to avoid CORS in dev
      '/indexer': {
        target: 'https://indexer.preview.midnight.network',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/indexer/, '/api/v1/graphql'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

