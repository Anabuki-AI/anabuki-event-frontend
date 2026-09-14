import { getRequestURL, proxyRequest, sendRedirect, setResponseHeader } from 'h3'

// One same-origin API in development and production. Forward HttpOnly session
// cookies and Set-Cookie headers, but leave OAuth redirects to the browser.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const url = getRequestURL(event)
  const target = `${config.backendBaseUrl.replace(/\/$/, '')}${url.pathname}${url.search}`
  const isOAuthNavigation = event.method === 'GET' && ['/api/auth/google/start', '/api/auth/google/callback'].includes(url.pathname)
  const returnToLogin = () => {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return sendRedirect(event, '/admin/login?auth_error=google', 302)
  }
  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    return await proxyRequest(event, target, {
      fetchOptions: { redirect: 'manual' },
      onResponse: async (event, response) => {
        // Override upstream caching too: authentication responses are private.
        setResponseHeader(event, 'Cache-Control', 'no-store')
        if (isOAuthNavigation && response.status >= 400) {
          await response.body?.cancel()
          await returnToLogin()
        }
      },
    })
  }
  catch (cause) {
    if (isOAuthNavigation && !event.handled) return returnToLogin()
    throw cause
  }
})
