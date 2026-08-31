import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Everything is local mock data; keep the bundle inspectable for a portfolio piece.
    sourcemap: true,
  },
})
