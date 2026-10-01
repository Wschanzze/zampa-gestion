import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    legacy({
      targets: ['chrome >= 100', 'edge >= 100', 'firefox >= 100'],
      modernPolyfills: true,
    }),
  ],
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('chrome >= 100, edge >= 100, firefox >= 100')),
    },
  },
  build: {
    target: ['es2020', 'chrome100', 'edge100', 'firefox100'],
  },
})
