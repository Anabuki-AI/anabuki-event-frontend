import { describe, expect, it, vi, beforeEach } from 'vitest'
import { request } from '../../app/lib/api/client'

vi.mock('~/lib/api/client', () => ({
  request: vi.fn(),
}))

const mockedRequest = vi.mocked(request)
const { fetchRankings } = await import('../../app/features/rankings/api/get-rankings')

const response = {
  rankings: [
    { rank: 1, participant_id: 7, display_name: 'アナブキ太郎' },
    { rank: 2, participant_id: 31, display_name: 'さくら' },
  ],
  me: { rank: 4, participant_id: 31, display_name: 'さくら' },
}

describe('fetchRankings (実API接続)', () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it('Cookie付きで /api/rankings を取得する', async () => {
    mockedRequest.mockResolvedValueOnce(response)

    await expect(fetchRankings()).resolves.toEqual(response)
    expect(mockedRequest).toHaveBeenCalledWith('/rankings', { credentials: 'include', retry: 0 })
  })

  it('参加者セッションが無い場合は me が null のレスポンスをそのまま返す', async () => {
    const anonymous = { rankings: response.rankings, me: null }
    mockedRequest.mockResolvedValueOnce(anonymous)

    await expect(fetchRankings()).resolves.toEqual(anonymous)
  })
})
