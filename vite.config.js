import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api/* to the Express backend so the browser never talks to Gemini directly
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
