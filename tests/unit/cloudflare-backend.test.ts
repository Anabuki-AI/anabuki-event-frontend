// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createBackendRequest, getCloudflareBackend, getRemoteBackendOrigin, isCloudflareRuntime } from '../../server/utils/cloudflare-backend'

describe('Cloudflare backend service binding', () => {
  it('reads BACKEND from Nitro cloudflare event context', () => {
    const backend = { fetch: vi.fn() }
    const event = {
      context: { cloudflare: { env: { BACKEND: backend } } },
      req: new Request('https://event.example/api/questions'),
    }

    expect(isCloudflareRuntime(event)).toBe(true)
    expect(getCloudflareBackend(event)).toBe(backend)
  })

  it.each([
    ['https', 'http', 'https'],
    ['http', 'https', 'http'],
  ] as const)('uses the incoming %s ingress protocol instead of spoofed X-Forwarded-Proto', (ingressProtocol, spoofedProtocol, expectedProtocol) => {
    const origin = `${ingressProtocol}://event.example`
    const event = {
      context: {},
      req: new Request(`${origin}/api/questions`, {
        method: 'POST',
        headers: {
          Origin: origin,
          Cookie: 'admin_session=opaque-token',
          'X-Forwarded-Proto': spoofedProtocol,
        },
        body: JSON.stringify({ question: 'test' }),
      }),
    }

    const request = createBackendRequest(
      event,
      new URL('https://anabuki-event-backend.internal/api/questions'),
      { forwardRequestHeaders: true },
    )

    expect(request.url).toBe('https://anabuki-event-backend.internal/api/questions')
    expect(request.headers.get('origin')).toBe(origin)
    expect(request.headers.get('cookie')).toBe('admin_session=opaque-token')
    expect(request.headers.get('x-forwarded-proto')).toBe(expectedProtocol)
    expect(request.headers.has('content-length')).toBe(false)
  })

  it('normalizes H3 Node plain-object headers and uses the trusted getRequestURL protocol', () => {
    const event = {
      context: {},
      req: {
        url: '/api/health',
        method: 'GET',
        headers: {
          origin: 'https://event.example',
          cookie: 'admin_session=opaque-token',
          'x-forwarded-proto': 'http',
          'x-test': ['one', 'two'],
          'content-length': '42',
        },
        body: null,
        signal: new AbortController().signal,
      },
    }

    const request = createBackendRequest(
      event,
      new URL('https://anabuki-event-backend.internal/api/health'),
      { forwardRequestHeaders: true, forwardedProto: 'https' },
    )

    expect(request.headers.get('origin')).toBe('https://event.example')
    expect(request.headers.get('cookie')).toBe('admin_session=opaque-token')
    expect(request.headers.get('x-test')).toBe('one, two')
    expect(request.headers.get('x-forwarded-proto')).toBe('https')
    expect(request.headers.has('content-length')).toBe(false)
  })

  it('exposes the tunnel origin only for https and drops the Host header for remote fetches', () => {
    const incomingOrigin = 'https://event.example'
    const tunnelEvent = {
      context: { cloudflare: { env: { NUXT_BACKEND_ORIGIN: 'https://api.anabuki-event.com' } } },
      req: new Request(`${incomingOrigin}/api/health`, {
        headers: { Origin: incomingOrigin, Host: 'event.example' },
      }),
    }
    expect(getRemoteBackendOrigin(tunnelEvent)).toBe('https://api.anabuki-event.com')

    const insecureEvent = {
      context: { cloudflare: { env: { NUXT_BACKEND_ORIGIN: 'http://api.anabuki-event.com' } } },
      req: new Request('https://event.example/api/health'),
    }
    expect(getRemoteBackendOrigin(insecureEvent)).toBeUndefined()

    const unboundEvent = { context: {}, req: new Request('https://event.example/api/health') }
    expect(getRemoteBackendOrigin(unboundEvent)).toBeUndefined()

    const request = createBackendRequest(
      tunnelEvent,
      new URL('https://api.anabuki-event.com/api/health'),
      { forwardRequestHeaders: true, forwardedProto: 'https', excludeHostHeader: true },
    )
    expect(request.headers.has('host')).toBe(false)
    expect(request.headers.get('origin')).toBe(incomingOrigin)
  })
})
