import { beforeEach, describe, expect, it, vi } from 'vitest'
import { operatorAuthApi } from '~/operator/api/operator-auth'
import { request } from '~/lib/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('operator auth API', () => {
  beforeEach(() => vi.resetAllMocks())

  it('checks the operator-specific OAuth status endpoint', async () => {
    mockedRequest.mockResolvedValue({ configured: true })

    await operatorAuthApi.configuration()

    expect(mockedRequest).toHaveBeenCalledWith('/auth/operator/google/status', { credentials: 'include' })
  })
})
