import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { adminAuthApi } from '~/admin/api/admin-auth'
import type { AccessRequest as AdminAccessRequest, OperatorAccessRequest } from '~/admin/types'
import { request } from '~/lib/api/client'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)
const operatorRequestId = '550e8400-e29b-41d4-a716-446655440000'

describe('admin access-request API ID contracts', () => {
  beforeEach(() => vi.resetAllMocks())

  it('keeps primary admin request IDs numeric', async () => {
    expectTypeOf<AdminAccessRequest['id']>().toEqualTypeOf<number>()

    await adminAuthApi.decide(42, 'approve')

    expect(mockedRequest).toHaveBeenCalledWith('/admin/access-requests/42/approve', {
      method: 'POST', credentials: 'include', retry: 0,
    })
  })

  it('keeps operator request IDs as UUID strings and interpolates them unchanged', async () => {
    expectTypeOf<OperatorAccessRequest['id']>().toEqualTypeOf<string>()

    await adminAuthApi.decideOperatorRequest(operatorRequestId, 'reject')

    expect(mockedRequest).toHaveBeenCalledWith(`/admin/operator-access-requests/${operatorRequestId}/reject`, {
      method: 'POST', credentials: 'include', retry: 0,
    })
  })
})
