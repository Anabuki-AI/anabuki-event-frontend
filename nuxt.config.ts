export default defineNuxtConfig({
  compatibilityDate: '2026-08-10',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/registration.css'],
  runtimeConfig: {
    backendBaseUrl: process.env.NUXT_BACKEND_BASE_URL || 'http://localhost:8080',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.NUXT_BACKEND_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  typescript: {
    typeCheck: true,
    strict: true,
  },
})
