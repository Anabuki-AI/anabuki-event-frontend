import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '~/lib/api/client'
import { fetchVotingRate } from '~/features/voting-rate/use-voting-rate'

vi.mock('~/lib/api/client', () => ({ request: vi.fn() }))

const mockedRequest = vi.mocked(request)

describe('fetchVotingRate', () => {
  beforeEach(() => mockedRequest.mockReset())

  it('snake_caseのwire形式を画面用camelCase DTOへ変換する', async () => {
    mockedRequest.mockResolvedValueOnce({
      questions: [{ question_id: 12, position: 3, answered_count: 2, answered_rate: 0.67 }],
      total_participants: 3,
    })

    await expect(fetchVotingRate()).resolves.toEqual({
      questions: [{ questionId: 12, position: 3, answeredCount: 2, answeredRate: 0.67 }],
      totalParticipants: 3,
    })
    expect(mockedRequest).toHaveBeenCalledWith('/operator/voting-rate', {
      credentials: 'include',
      retry: 0,
    })
  })
})
