import { effectScope, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectorRanking } from '~/features/projector/use-projector-ranking'
import type { RankingsResponse } from '~/features/rankings/types'

const apiMocks = vi.hoisted(() => ({
  fetchRankings: vi.fn(),
}))
vi.mock('~/features/rankings/api/get-rankings', () => apiMocks)

const { fetchRankings } = apiMocks

function makeEntry(rank: number) {
  return { rank, participantId: `p${rank}`, displayName: `参加者${rank}`, totalPoints: 100 - rank }
}

function response(count: number): RankingsResponse {
  return { rankings: Array.from({ length: count }, (_unused, i) => makeEntry(i + 1)), me: null }
}

describe('useProjectorRanking', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fetchRankings.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('active になったら即座に取得し、最大10件だけを返す', async () => {
    fetchRankings.mockResolvedValue(response(15))
    const active = ref(false)
    const scope = effectScope()
    const { topTen, isLoading } = scope.run(() => useProjectorRanking(active))!

    active.value = true
    await vi.waitFor(() => expect(fetchRankings).toHaveBeenCalledTimes(1))
    await nextTick()

    expect(topTen.value).toHaveLength(10)
    expect(topTen.value[0]).toEqual(makeEntry(1))
    expect(isLoading.value).toBe(false)
    scope.stop()
  })

  it('active な間だけポーリングし、非activeで止める', async () => {
    fetchRankings.mockResolvedValue(response(3))
    const active = ref(true)
    const scope = effectScope()
    scope.run(() => useProjectorRanking(active))
    await vi.waitFor(() => expect(fetchRankings).toHaveBeenCalledTimes(1))

    await vi.advanceTimersByTimeAsync(10_000)
    expect(fetchRankings).toHaveBeenCalledTimes(2)

    active.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(30_000)
    expect(fetchRankings).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('取得に失敗してもエラーメッセージを保持し、直前のランキングは残す', async () => {
    fetchRankings.mockResolvedValueOnce(response(2))
    const active = ref(true)
    const scope = effectScope()
    const { topTen, errorMessage } = scope.run(() => useProjectorRanking(active))!
    await vi.waitFor(() => expect(topTen.value).toHaveLength(2))

    fetchRankings.mockRejectedValueOnce(Object.assign(new Error('boom'), { statusCode: 500 }))
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.waitFor(() => expect(errorMessage.value).not.toBe(''))

    expect(topTen.value).toHaveLength(2)
    scope.stop()
  })
})
