// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createBackendRequest, getCloudflareBackend, isCloudflareRuntime } from '../../server/utils/cloudflare-backend'

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

  it('preserves Origin and cookies while replacing spoofable forwarded protocol', () => {
    const event = {
      context: {},
      req: new Request('https://event.example/api/questions', {
        method: 'POST',
        headers: {
          Origin: 'https://event.example',
          Cookie: 'admin_session=opaque-token',
          'X-Forwarded-Proto': 'http',
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
    expect(request.headers.get('origin')).toBe('https://event.example')
    expect(request.headers.get('cookie')).toBe('admin_session=opaque-token')
    expect(request.headers.get('x-forwarded-proto')).toBe('https')
    expect(request.headers.has('content-length')).toBe(false)
  })

  it('accepts H3 Node-compatible headers in a Cloudflare request path', () => {
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
  })
})
