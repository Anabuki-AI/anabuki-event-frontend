import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../app/lib/api/error'

vi.mock('~/lib/api/client', () => ({
  request: vi.fn(),
}))

const { fetchMyRanking, fetchRanking } = await import('../../app/features/rankings/api/get-rankings')

const mockEntry = { rank: 1, userId: 101, userName: 'アナブキ太郎', points: 320 }

describe('fetchRanking (USE_MOCK=true)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the mock ranking without touching the API', async () => {
    const entries = await fetchRanking()

    expect(entries).toHaveLength(10)
    expect(entries[0]).toMatchObject({ rank: 1, userName: expect.any(String) })
  })

  it('returns a copy so callers cannot mutate the mock source', async () => {
    const entries = await fetchRanking()
    entries[0].points = -1

    expect((await fetchRanking())[0].points).toBe(320)
  })
})

describe('fetchMyRanking (USE_MOCK=true)', () => {
  it('resolves the mock entry for a known mock userId', async () => {
    await expect(fetchMyRanking(mockEntry.userId)).resolves.toMatchObject({ rank: 1, userName: 'アナブキ太郎' })
  })

  it('rejects with a 404 ApiError for an unknown mock userId', async () => {
    const error = await fetchMyRanking(999).catch((caught: ApiError) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(404)
  })
})
