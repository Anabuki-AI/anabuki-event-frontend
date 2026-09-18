// @vitest-environment node

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const setResponseHeader = vi.fn()

vi.mock('h3', () => ({
  createError: ({ statusCode, statusMessage }: { statusCode: number, statusMessage: string }) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
  getRequestURL: (event: { req: Request }) => new URL(event.req.url),
  setResponseHeader,
}))

type HealthHandler = (event: unknown) => Promise<{ status: string }>
let handler: HealthHandler

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (candidate: HealthHandler) => candidate)
  handler = (await import('../../server/api/admin/service-health.get')).default as HealthHandler
})

beforeEach(() => {
  vi.clearAllMocks()
})

function cloudflareEvent(env: Record<string, unknown>) {
  return {
    context: { cloudflare: { env } },
    method: 'GET',
    req: new Request('https://anabuki-event.com/api/admin/service-health', {
      headers: {
        Cookie: 'admin_session=must-not-leak',
        Origin: 'https://anabuki-event.com',
      },
    }),
  }
}

describe('admin service health route', () => {
  it('uses the production /api/health tunnel contract without browser credentials', async () => {
    const backendFetch = vi.fn().mockResolvedValue(Response.json({ status: 'ok' }))
    vi.stubGlobal('fetch', backendFetch)

    await expect(handler(cloudflareEvent({
      NUXT_BACKEND_ORIGIN: 'https://api.anabuki-event.com',
    }))).resolves.toEqual({ status: 'ok' })

    expect(backendFetch).toHaveBeenCalledTimes(1)
    const request = backendFetch.mock.calls[0]![0] as Request
    expect(request).toBeInstanceOf(Request)
    expect(request.url).toBe('https://api.anabuki-event.com/api/health')
    expect(request.redirect).toBe('manual')
    expect(request.headers.get('x-forwarded-proto')).toBe('https')
    expect(request.headers.has('cookie')).toBe(false)
    expect(request.headers.has('origin')).toBe(false)
    expect(request.headers.has('host')).toBe(false)
  })

  it('uses the API-prefixed health endpoint through a service binding fallback', async () => {
    const serviceFetch = vi.fn().mockResolvedValue(Response.json({ status: 'ok' }))

    await expect(handler(cloudflareEvent({
      BACKEND: { fetch: serviceFetch },
    }))).resolves.toEqual({ status: 'ok' })

    expect(serviceFetch).toHaveBeenCalledTimes(1)
    const request = serviceFetch.mock.calls[0]![0] as Request
    expect(request.url).toBe('https://anabuki-event-backend.internal/api/health')
    expect(request.headers.has('cookie')).toBe(false)
    expect(request.headers.has('origin')).toBe(false)
  })

  it('uses the same API-prefixed contract in the local Node runtime', async () => {
    const localFetch = vi.fn().mockResolvedValue({ status: 'ok' })
    vi.stubGlobal('useRuntimeConfig', () => ({ backendBaseUrl: 'http://localhost:8080/' }))
    vi.stubGlobal('$fetch', localFetch)

    const event = {
      context: {},
      method: 'GET',
      req: new Request('http://localhost:3000/api/admin/service-health'),
    }
    await expect(handler(event)).resolves.toEqual({ status: 'ok' })

    expect(localFetch).toHaveBeenCalledWith('http://localhost:8080/api/health', {
      timeout: 5000,
      retry: 0,
      redirect: 'error',
    })
  })
})
