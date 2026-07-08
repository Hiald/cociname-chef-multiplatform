import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

const API_TARGET = process.env.VITE_DEV_API_TARGET || 'https://apidev.cociname.pe'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  server: {
    host: true,
    proxy: {
      // En prod nginx proxya /api/ al backend; en local Vite hace lo mismo.
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
      },
      '/notificationHub': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
})
