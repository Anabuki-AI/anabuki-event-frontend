import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

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
