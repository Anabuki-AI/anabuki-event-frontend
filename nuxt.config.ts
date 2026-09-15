export default defineNuxtConfig({
  compatibilityDate: '2026-08-10',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/waiting.css'],
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1',
    },
  },
  runtimeConfig: {
    backendBaseUrl: process.env.NUXT_BACKEND_BASE_URL || 'http://localhost:8080',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
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
