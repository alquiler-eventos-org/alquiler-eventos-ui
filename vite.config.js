import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // El navegador llama a /ms/compras/** y Vite lo reenvía al microservicio
      // de compras (puerto 8082). Así no hace falta CORS en desarrollo.
      '/ms/compras': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ms\/compras/, '/api'),
      },
      // Ídem para el microservicio de alquiler (puerto 8081).
      '/ms/alquiler': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ms\/alquiler/, '/api'),
      },
    },
  },
})