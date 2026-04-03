import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,      // Forzamos el puerto 5180
    strictPort: true // Si el 5180 está ocupado, da error en lugar de saltar al 5181
  }
})