import type { Ref } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { fetchRankings } from '~/features/rankings/api/get-rankings'
import type { RankingEntry } from '~/features/rankings/types'
import { toApiError } from '~/lib/api/error'

/**
 * 大画面の最終結果(ランキング)表示中だけ動かす、軽量ポーリング。
 * クイズ終了後は点数が動かない前提のため、問題進行中の2秒ポーリングより間隔を空ける。
 */
export const PROJECTOR_RANKING_POLL_INTERVAL_MS = 10_000

/** `active` が true の間だけ /api/rankings を取得・ポーリングし、1〜10位を返す。 */
export function useProjectorRanking(active: Ref<boolean>) {
  const ranking = ref<RankingEntry[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight = false

  async function refresh() {
    if (inFlight) return
    inFlight = true
    if (ranking.value.length === 0) isLoading.value = true
    try {
      const response = await fetchRankings()
      ranking.value = response.rankings
      errorMessage.value = ''
    }
    catch (error) {
      errorMessage.value = toApiError(error).message
    }
    finally {
      isLoading.value = false
      inFlight = false
    }
  }

  function start() {
    void refresh()
    if (timer === null) {
      timer = setInterval(() => void refresh(), PROJECTOR_RANKING_POLL_INTERVAL_MS)
    }
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  // 終了画面が出ている間だけ取得し、離れたら止める(不要なポーリングをしない)。
  watch(active, (value) => {
    if (value) start()
    else stop()
  }, { immediate: true })

  onUnmounted(stop)

  const topTen = computed(() => ranking.value.slice(0, 10))

  return { topTen, isLoading, errorMessage }
}
