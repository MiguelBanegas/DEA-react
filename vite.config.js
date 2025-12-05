import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/upload': 'http://localhost:3001',
      '/planillas': 'http://localhost:3001',
      '/mapa-static': 'http://localhost:3001'
    }
  }
})
