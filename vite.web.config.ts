import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone web build for GitHub Pages.
// Output goes to web-dist/ (separate from the Electron out/).
export default defineConfig({
  base: '/KMeserve/world-cup-tracker/',
  root: resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
    },
  },
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'web-dist'),
    emptyOutDir: true,
  },
})
