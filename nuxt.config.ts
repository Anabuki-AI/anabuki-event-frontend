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
      // Enable only after the audit-log backend (backend-rails PR #30) is merged
      // and deployed; see docs/audit-log-contract.md. While false, the console
      // makes no request and keeps the explicit unconnected state.
      adminAuditLogEnabled: false,
      // Rails GET /api/admin/api-status is already implemented (AdminApiStatus),
      // so this panel is on by default; the flag remains as a kill switch.
      adminApiStatusEnabled: true,
    },
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      wrangler: {
        services: [
          {
            binding: 'BACKEND',
            service: 'anabuki-event-backend',
          },
        ],
      },
    },
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
