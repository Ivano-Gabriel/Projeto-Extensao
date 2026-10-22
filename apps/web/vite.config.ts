import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // o front chama /api/... e o Vite repassa para o Backend
    proxy: { '/api': 'http://localhost:3001' },
  },
})
