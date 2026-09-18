import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { RankingEntry } from '~/features/rankings/types'
import { fetchRankings } from '~/features/rankings/api/get-rankings'
import { useRankings } from '~/features/rankings/composables/use-rankings'

vi.mock('~/features/rankings/api/get-rankings', () => ({
  fetchRankings: vi.fn(),
}))

const mockedFetchRankings = vi.mocked(fetchRankings)
const emptyResponse = { rankings: [], me: null }
const ranking: RankingEntry = {
  rank: 1,
  participantId: 'participant-1',
  displayName: '参加者',
}

let data: Ref<typeof emptyResponse>
let error: Ref<unknown>
let status: Ref<'pending' | 'success' | 'error'>
let refresh: ReturnType<typeof vi.fn>
let wrapper: VueWrapper | undefined
let state: ReturnType<typeof useRankings>

function mountProbe() {
  wrapper = mount(defineComponent({
    setup() {
      state = useRankings()
      return () => h('div')
    },
  }))
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers()
  data = ref(emptyResponse)
  error = ref<unknown>(null)
  status = ref<'pending' | 'success' | 'error'>('pending')
  refresh = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('useAsyncData', vi.fn(() => ({ data, error, status, refresh })))
  mockedFetchRankings.mockReset()
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('ランキングの初期読み込み', () => {
  it('SSRを待たず、client-only lazy fetchを設定する', () => {
    mountProbe()

    expect(state.ranking.value).toEqual([])
    expect(useAsyncData).toHaveBeenCalledWith(
      'rankings',
      expect.any(Function),
      expect.objectContaining({ server: false, lazy: true }),
    )
    expect(mockedFetchRankings).not.toHaveBeenCalled()
  })

  it('初回取得のdata/errorをreactiveに画面状態へ反映する', async () => {
    mountProbe()

    data.value = { rankings: [ranking], me: ranking }
    status.value = 'success'
    await nextTick()
    expect(state.ranking.value).toEqual([ranking])
    expect(state.myRanking.value).toEqual(ranking)

    error.value = new Error('network')
    status.value = 'error'
    await nextTick()
    expect(state.rankingError.value).toContain('network')
  })

  it('15秒pollingとvisibility変更時の即時更新を維持する', async () => {
    mountProbe()
    await flushPromises()

    await vi.advanceTimersByTimeAsync(15_000)
    expect(refresh).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(15_000)
    expect(refresh).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()
    expect(refresh).toHaveBeenCalledTimes(2)

    expect(state.status.value).toBe('pending')
  })
})
