import { setResponseHeader } from 'h3'

// Rails /health is a public, liveness-only check. Never accept a target from input
// and never forward session cookies to a monitoring destination.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { backendBaseUrl } = useRuntimeConfig(event)
  const result = await $fetch<{ status: string }>(`${backendBaseUrl.replace(/\/$/, '')}/health`, {
    timeout: 5000,
    retry: 0,
    redirect: 'error',
  })
  return { status: result.status === 'ok' ? 'ok' : 'unknown' }
})
