import { createError, setResponseHeader } from 'h3'

// Rails /health is a public, liveness-only check. Never accept a target from input
// and never forward session cookies or Origin to a monitoring destination.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    const { backendBaseUrl } = useRuntimeConfig(event)
    const result = await $fetch<{ status: string }>(`${backendBaseUrl.replace(/\/$/, '')}/health`, {
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
