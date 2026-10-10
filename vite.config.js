import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Las dos rutas van al API GATEWAY (puerto 8080), que las enruta a
      // ms-compras o ms-alquiler via Eureka. Toda la UI pasa por la puerta
      // unica: igual que en la demo de la rubrica.
      '/ms/compras': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ms\/compras/, '/api'),
      },
      // En la practica ambas rutas llegan al MISMO gateway; se separa el
      // prefijo solo para que el front distinga que microservicio usa.
      '/ms/alquiler': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ms\/alquiler/, '/api'),
      },
    },
  },
})