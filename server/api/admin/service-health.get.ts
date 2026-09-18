import { createError, getRequestURL, setResponseHeader } from 'h3'
import { createBackendRequest, getCloudflareBackend, getRemoteBackendOrigin, isCloudflareRuntime } from '../../utils/cloudflare-backend'

// Rails /api/health is a public, liveness-only check. Never accept a target from input
// and never forward session cookies or Origin to a monitoring destination.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const cloudflareRuntime = isCloudflareRuntime(event)
  const cloudflareBackend = getCloudflareBackend(event)
  const remoteOrigin = getRemoteBackendOrigin(event)

  try {
    if (cloudflareRuntime) {
      if (remoteOrigin) {
        // Use the same Request-shaped /api tunnel contract as the working API
        // proxy while intentionally omitting all browser headers and cookies.
        const target = new URL('/api/health', remoteOrigin)
        const response = await fetch(createBackendRequest(event, target, {
          forwardedProto: getRequestURL(event).protocol.replace(':', ''),
          excludeHostHeader: true,
        }))
        if (!response.ok) {
          await response.body?.cancel()
          throw createError({ statusCode: 502, statusMessage: 'Backend health check failed' })
        }
        const result = await response.json() as { status?: string }
        return { status: result.status === 'ok' ? 'ok' : 'unknown' }
      }

      if (!cloudflareBackend) {
        throw createError({ statusCode: 503, statusMessage: 'Backend service binding is not configured' })
      }
      const target = new URL('/api/health', 'https://anabuki-event-backend.internal')
      const response = await cloudflareBackend.fetch(createBackendRequest(event, target, {
        forwardedProto: getRequestURL(event).protocol.replace(':', ''),
      }))
      if (!response.ok) {
        await response.body?.cancel()
        throw createError({ statusCode: 502, statusMessage: 'Backend health check failed' })
      }
      const result = await response.json() as { status?: string }
      return { status: result.status === 'ok' ? 'ok' : 'unknown' }
    }

    const { backendBaseUrl } = useRuntimeConfig(event)
    const result = await $fetch<{ status: string }>(`${backendBaseUrl.replace(/\/$/, '')}/api/health`, {
      timeout: 5000,
      retry: 0,
      redirect: 'error',
    })
    return { status: result.status === 'ok' ? 'ok' : 'unknown' }
  }
  catch {
    // Do not relay backend configuration errors, URLs, or response bodies.
    throw createError({ statusCode: 502, statusMessage: 'Backend health check failed' })
  }
})
