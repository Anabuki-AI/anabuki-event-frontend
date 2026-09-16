import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// plugin-vue is supplied transitively by Nuxt. Resolve its installed ESM entry
// explicitly so Vitest does not attempt a CommonJS require of it.
const require = createRequire(import.meta.url)
const vue = (await import(pathToFileURL(require.resolve('@vitejs/plugin-vue')).href)).default

// pnpm の厳密な node_modules レイアウトでも解決できるよう実パスで読み込む
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const vue = require('@vitejs/plugin-vue').default

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
})
