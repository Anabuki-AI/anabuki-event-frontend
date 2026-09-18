// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createBackendRequest, isCloudflareRuntime, sanitizeBackendResponse } from '../../server/utils/cloudflare-backend'

describe('Cloudflare backend tunnel proxy', () => {
  it('detects the Nitro Cloudflare runtime without requiring a service binding', () => {
    const event = {
      context: { cloudflare: { env: {} } },
      req: new Request('https://event.example/api/questions'),
    }

    expect(isCloudflareRuntime(event)).toBe(true)
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
    expect(request.headers.has('host')).toBe(false)
    expect(request.headers.has('x-forwarded-proto')).toBe(true)
  })

  it('removes hop-by-hop response headers while retaining cookies', () => {
    const response = sanitizeBackendResponse(new Response('ok', {
      status: 200,
      headers: {
        Connection: 'keep-alive',
        'Set-Cookie': 'admin_session=opaque-token; HttpOnly',
        'X-Test': 'ok',
      },
    }))

    expect(response.headers.has('connection')).toBe(false)
    expect(response.headers.get('x-test')).toBe('ok')
    expect(response.headers.get('set-cookie')).toContain('admin_session=opaque-token')
    expect(response.headers.get('cache-control')).toBe('no-store')
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
})
