import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// La UI llama directo al API Gateway (http://localhost:8080/api); no hay proxy.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
