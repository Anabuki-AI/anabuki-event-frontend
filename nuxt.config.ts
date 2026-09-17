export default defineNuxtConfig({
  compatibilityDate: '2026-08-10',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  css: [
    '~/assets/css/registration.css',
    '~/assets/css/main.css',
    '~/assets/css/management.css',
  ],
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1',
    },
  },
  runtimeConfig: {
    backendBaseUrl: process.env.NUXT_BACKEND_BASE_URL || 'http://localhost:8080',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      // Enabled now that the backend implements docs/admin-monitoring-contract.md.
      // See frontend PR: requires backend PR #29 to be merged & deployed first.
      adminMonitoringEnabled: true,
    },
  },
  nitro: {
    devProxy: {
      // h3がマウント済みプレフィックス(/api)をreq.urlから取り除いてから
      // プロキシへ渡すため、転送先に /api パスを含めて復元する
      '/api': {
        target: `${process.env.NUXT_BACKEND_BASE_URL || 'http://localhost:8080'}/api`,
        changeOrigin: true,
      },
    },
  },
  routeRules: {
    '/admin': { headers: { 'cache-control': 'no-store' } },
    '/admin/**': { headers: { 'cache-control': 'no-store' } },
    '/operator': { headers: { 'cache-control': 'no-store' } },
    '/operator/**': { headers: { 'cache-control': 'no-store' } },
  },
  typescript: {
    typeCheck: true,
    strict: true,
  },
})
