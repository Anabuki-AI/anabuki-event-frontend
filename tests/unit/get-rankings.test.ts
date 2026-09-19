import { describe, expect, it, vi, beforeEach } from 'vitest'
import { request } from '../../app/lib/api/client'

vi.mock('~/lib/api/client', () => ({
  request: vi.fn(),
}))

const mockedRequest = vi.mocked(request)
const { fetchRankings } = await import('../../app/features/rankings/api/get-rankings')

const wireResponse = {
  rankings: [
    { rank: 1, participant_id: '550e8400-e29b-41d4-a716-446655440000', display_name: 'アナブキ太郎', total_points: 300 },
    { rank: 2, participant_id: '650e8400-e29b-41d4-a716-446655440000', display_name: 'さくら', total_points: -50 },
  ],
  me: { rank: 4, participant_id: '650e8400-e29b-41d4-a716-446655440000', display_name: 'さくら', total_points: -50 },
}

const response = {
  rankings: [
    { rank: 1, participantId: '550e8400-e29b-41d4-a716-446655440000', displayName: 'アナブキ太郎', totalPoints: 300 },
    { rank: 2, participantId: '650e8400-e29b-41d4-a716-446655440000', displayName: 'さくら', totalPoints: -50 },
  ],
  me: { rank: 4, participantId: '650e8400-e29b-41d4-a716-446655440000', displayName: 'さくら', totalPoints: -50 },
}

describe('fetchRankings (実API接続)', () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it('Cookie付きで /api/rankings を取得する', async () => {
    mockedRequest.mockResolvedValueOnce(wireResponse)

    await expect(fetchRankings()).resolves.toEqual(response)
    expect(mockedRequest).toHaveBeenCalledWith('/rankings', { credentials: 'include', retry: 0 })
  })

  it('参加者セッションが無い場合は me が null のレスポンスをそのまま返す', async () => {
    const anonymous = { rankings: wireResponse.rankings, me: null }
    const convertedAnonymous = { rankings: response.rankings, me: null }
    mockedRequest.mockResolvedValueOnce(anonymous)

    await expect(fetchRankings()).resolves.toEqual(convertedAnonymous)
  })
})
