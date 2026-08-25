import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../app/lib/api/error'

const requestMock = vi.fn()

vi.mock('~/lib/api/client', () => ({
  request: requestMock,
}))

const { fetchMyRanking, fetchRanking } = await import('../../app/features/rankings/api/get-rankings')

describe('fetchRanking', () => {
  it('requests the rankings endpoint', async () => {
    const entries = [{ rank: 1, userName: 'alice', points: 350 }]
    requestMock.mockResolvedValueOnce(entries)

    await expect(fetchRanking()).resolves.toEqual(entries)
    expect(requestMock).toHaveBeenCalledWith('/rankings')
  })
})

describe('fetchMyRanking', () => {
  it('requests the per-user ranking endpoint with the userId path segment', async () => {
    const entry = { rank: 42, userName: 'alice', points: 5 }
    requestMock.mockResolvedValueOnce(entry)

    await expect(fetchMyRanking(42)).resolves.toEqual(entry)
    expect(requestMock).toHaveBeenCalledWith('/rankings/users/42')
  })

  it('propagates request failures so callers can inspect the status code', async () => {
    requestMock.mockRejectedValueOnce(new ApiError('User not found', 404))

    const error = await fetchMyRanking(999).catch(apiError => apiError)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('User not found')
  })
})
