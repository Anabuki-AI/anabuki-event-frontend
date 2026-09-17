import { afterEach, describe, expect, it, vi } from 'vitest'

const request = vi.fn()
vi.mock('~/lib/api/client', () => ({ request }))

const { adminConsoleApi } = await import('~/admin/api/admin-console')

afterEach(() => vi.clearAllMocks())

describe('admin api-status request boundary', () => {
  it('uses the Rails api-status URL with the session, no retries, and the existing timeout budget', () => {
    adminConsoleApi.monitoring()

    expect(request).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledWith('/admin/api-status', {
      credentials: 'include',
      retry: 0,
      timeout: 10000,
    })
  })

  it('does not call the retired monitoring endpoint', () => {
    adminConsoleApi.monitoring()
    expect(request).not.toHaveBeenCalledWith('/admin/monitoring', expect.anything())
  })
})
