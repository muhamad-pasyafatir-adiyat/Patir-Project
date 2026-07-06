import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/portfolio/',
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: 'public/portfolio',
    emptyOutDir: true,
  },
})
