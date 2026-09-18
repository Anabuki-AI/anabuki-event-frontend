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
    // Browser requests always use the same-origin /api route. This URL is
    // consumed only by the server-side proxy; production is the API hostname
    // behind Cloudflare Tunnel and development keeps the local Rails fallback.
    backendBaseUrl: process.env.NUXT_BACKEND_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://api.anabuki-event.com' : 'http://localhost:8080'),
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      // Rails GET /api/admin/api-status is the monitoring contract. Keep this
      // presentation flag OFF until the target deployment has provider settings
      // and its authenticated proxy path has been verified.
      adminMonitoringEnabled: false,
      // Enable only after the audit-log backend (backend-rails PR #30) is merged
      // and deployed; see docs/audit-log-contract.md. While false, the console
      // makes no request and keeps the explicit unconnected state.
      adminAuditLogEnabled: false,
    },
  },
  nitro: {
    preset: 'cloudflare_module',
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
