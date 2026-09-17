import { createError, getRequestURL, proxyRequest, sendRedirect, setResponseHeader } from 'h3'
import { createBackendRequest, getCloudflareBackend, isCloudflareRuntime } from '../utils/cloudflare-backend'

// One same-origin API in development and production. Forward HttpOnly session
// cookies and Set-Cookie headers, but leave OAuth redirects to the browser.
const OAUTH_NAVIGATION_PATHS = new Set([
  '/api/auth/google/start',
  '/api/auth/google/callback',
  '/api/auth/operator/google/start',
  '/api/auth/operator/google/callback',
])

// Failed OAuth navigations are bounced back to the portal that started them.
const OAUTH_LOGIN_PATHS = {
  admin: '/admin/login?auth_error=google',
  operator: '/operator/login?auth_error=google',
} as const

function oauthLoginPath(pathname: string) {
  return pathname.includes('/operator/')
    ? OAUTH_LOGIN_PATHS.operator
    : OAUTH_LOGIN_PATHS.admin
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const url = getRequestURL(event)
  const target = `${config.backendBaseUrl.replace(/\/$/, '')}${url.pathname}${url.search}`
  const cloudflareRuntime = isCloudflareRuntime(event)
  const cloudflareBackend = getCloudflareBackend(event)
  const isOAuthNavigation = event.method === 'GET' && OAUTH_NAVIGATION_PATHS.has(url.pathname)
  const returnToLogin = () => {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return sendRedirect(event, oauthLoginPath(url.pathname), 302)
  }
  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    if (cloudflareRuntime) {
      if (!cloudflareBackend) {
        throw createError({ statusCode: 503, statusMessage: 'Backend service binding is not configured' })
      }

      // Service bindings keep Rails off the public Internet. The hostname is
      // only a placeholder used to construct a valid Request for the binding.
      const serviceTarget = new URL(`${url.pathname}${url.search}`, 'https://anabuki-event-backend.internal')
      const serviceRequest = createBackendRequest(event, serviceTarget, { forwardRequestHeaders: true })
      const response = await cloudflareBackend.fetch(serviceRequest)
      if (isOAuthNavigation && response.status >= 400) {
        await response.body?.cancel()
        return returnToLogin()
      }
      return response
    }

    const response = await proxyRequest(event, target, {
      fetchOptions: { redirect: 'manual' },
      onResponse: async (event) => {
        // Override upstream caching too: authentication responses are private.
        setResponseHeader(event, 'Cache-Control', 'no-store')
      },
    })
    if (isOAuthNavigation && response.status >= 400) {
      await response.body?.cancel()
      return returnToLogin()
    }
    return response
  }
  catch (cause) {
    if (isOAuthNavigation && !event.handled) return returnToLogin()
    throw cause
  }
})
