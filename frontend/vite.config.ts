import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Allow frontend to import compiled contract from project root
      '@contract': path.resolve(__dirname, '../managed/contract/index.js'),
      // Allow compact-runtime from root node_modules
      '@midnight-ntwrk/compact-runtime': path.resolve(__dirname, '../node_modules/@midnight-ntwrk/compact-runtime/dist/index.js'),
      '@midnight-ntwrk/midnight-js-http-client-proof-provider': path.resolve(__dirname, '../node_modules/@midnight-ntwrk/midnight-js-http-client-proof-provider/dist/index.js'),
    },
  },
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

