import { computed, onMounted, onUnmounted, ref } from 'vue'
import { fetchRankings } from '../api/get-rankings'
import type { RankingEntry } from '../types'
import { toApiError } from '~/lib/api/error'

const POLL_INTERVAL_MS = 15_000

export async function useRankings() {
  const ranking = ref<RankingEntry[]>([])
  const myRanking = ref<RankingEntry | null>(null)
  const rankingError = ref('')
  const isRefreshing = ref(false)
  const lastUpdatedAt = ref<Date | null>(null)

  const topThree = computed(() => ranking.value.slice(0, 3))
  const rest = computed(() => ranking.value.slice(3, 10))

  const formattedUpdatedAt = computed(() =>
    lastUpdatedAt.value
      ? lastUpdatedAt.value.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '',
  )

  // useAsyncData は setup の同期実行中に呼び出し、サーバー側で onServerPrefetch を登録させる
  const rankingsData = useAsyncData('rankings', () => fetchRankings(), { default: () => ({ rankings: [], me: null }) })

  let pollTimer: ReturnType<typeof setInterval> | undefined

  function applyResponse() {
    const data = rankingsData.data.value
    ranking.value = data?.rankings ?? []
    myRanking.value = data?.me ?? null
    rankingError.value = rankingsData.error.value ? toApiError(rankingsData.error.value).message : ''
    if (ranking.value.length > 0) {
      lastUpdatedAt.value = new Date()
    }
  }

  async function handleRefresh() {
    if (isRefreshing.value) {
      return
    }
    isRefreshing.value = true

    try {
      await rankingsData.refresh()
      applyResponse()
    }
    finally {
      isRefreshing.value = false
    }
  }

  function startPolling() {
    if (pollTimer === undefined) {
      pollTimer = setInterval(handleRefresh, POLL_INTERVAL_MS)
    }
  }

  function stopPolling() {
    if (pollTimer !== undefined) {
      clearInterval(pollTimer)
      pollTimer = undefined
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      void handleRefresh()
      startPolling()
    }
    else {
      stopPolling()
    }
  }

  // ライフサイクルフックは最初の await より前に登録する(待機後はコンポーネントインスタンスが失われ登録できない)
  onMounted(() => {
    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    stopPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  // 初回フェッチの完了を待ってから状態へ反映する(SSR では描画の前に完了する)
  await rankingsData
  applyResponse()

  return {
    ranking,
    topThree,
    rest,
    rankingError,
    status: rankingsData.status,
    myRanking,
    isRefreshing,
    formattedUpdatedAt,
    handleRefresh,
  }
}
