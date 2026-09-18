import { createError, getRequestURL, proxyRequest, sendRedirect, setResponseHeader } from 'h3'
import { createBackendRequest, isCloudflareRuntime, sanitizeBackendResponse } from '../utils/cloudflare-backend'

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
  const backendBaseUrl = String(config.backendBaseUrl).replace(/\/$/, '')
  const target = `${backendBaseUrl}${url.pathname}${url.search}`
  const cloudflareRuntime = isCloudflareRuntime(event)
  const isOAuthNavigation = event.method === 'GET' && OAUTH_NAVIGATION_PATHS.has(url.pathname)
  const returnToLogin = () => {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return sendRedirect(event, oauthLoginPath(url.pathname), 302)
  }
  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    if (cloudflareRuntime) {
      let upstream: URL
      try {
        upstream = new URL(target)
      }
      catch {
        throw createError({ statusCode: 503, statusMessage: 'Backend upstream is not configured' })
      }
      if (!['http:', 'https:'].includes(upstream.protocol)) {
        throw createError({ statusCode: 503, statusMessage: 'Backend upstream protocol is invalid' })
      }

      // Production uses the Cloudflare Tunnel hostname. The browser still
      // calls this same-origin /api route, so cookies and OAuth redirects stay
      // on anabuki-event.com; only this server-side fetch crosses the tunnel.
      const response = await fetch(createBackendRequest(event, upstream, {
        forwardRequestHeaders: true,
        forwardedProto: url.protocol.replace(':', ''),
      }))
      if (isOAuthNavigation && response.status >= 400) {
        await response.body?.cancel()
        return returnToLogin()
      }
      return sanitizeBackendResponse(response)
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
