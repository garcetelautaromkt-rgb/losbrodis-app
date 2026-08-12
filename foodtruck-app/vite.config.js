import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' es importante para que los assets se resuelvan con rutas
// relativas cuando la app se sirve desde el WebView local de Capacitor.
export default defineConfig({
  base: './',
  plugins: [react()],
})
