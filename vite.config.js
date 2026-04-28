import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is the URL prefix the app is served from. For GitHub Pages
// project sites that's `/<repo-name>/`. Override at build time with
// `--base=/foo/` or set BASE env var.
const repoBase = process.env.BASE ?? '/solar-system-explorer/'

export default defineConfig({
  base: repoBase,
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
