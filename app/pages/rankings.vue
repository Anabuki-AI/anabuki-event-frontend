<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MyRankingPanel from '~/features/rankings/components/MyRankingPanel.vue'
import RankingList from '~/features/rankings/components/RankingList.vue'
import RankingTopCards from '~/features/rankings/components/RankingTopCards.vue'
import { fetchMyRanking, fetchRanking } from '~/features/rankings/api/get-rankings'
import type { RankingEntry } from '~/features/rankings/types'
import { clearMyUserId, getMyUserId } from '~/features/rankings/storage'
import { toApiError } from '~/lib/api/error'

useSeoMeta({
  title: 'ランキング',
  description: 'クイズ参加者の獲得ポイントランキングです。',
})

const POLL_INTERVAL_MS = 15_000

const ranking = ref<RankingEntry[]>([])
const myRanking = ref<RankingEntry | null>(null)
const myRankingError = ref('')
const myUserId = ref<number | null>(null)
const myRankingNotFound = ref(false)
const isMyRankingLoading = ref(false)
const isRefreshing = ref(false)
const lastUpdatedAt = ref<Date | null>(null)
const rankingError = ref('')

const topThree = computed(() => ranking.value.slice(0, 3))
const rest = computed(() => ranking.value.slice(3, 10))

const { data, error, status, refresh } = await useAsyncData(
  'rankings',
  () => fetchRanking(),
  { default: () => [] },
)

ranking.value = data.value ?? []
rankingError.value = error.value ? toApiError(error.value).message : ''

let pollTimer: ReturnType<typeof setInterval> | undefined

async function loadMyRanking() {
  const userId = getMyUserId()
  myUserId.value = userId
  myRankingNotFound.value = false
  if (userId === null) {
    myRanking.value = null
    myRankingError.value = ''
    return
  }

  isMyRankingLoading.value = true
  try {
    myRanking.value = await fetchMyRanking(userId)
    myRankingError.value = ''
  }
  catch (error) {
    const apiError = toApiError(error)
    myRanking.value = null
    if (apiError.statusCode === 404) {
      clearMyUserId()
      myUserId.value = null
      myRankingNotFound.value = true
      myRankingError.value = ''
    }
    else {
      myRankingError.value = apiError.message
    }
  }
  finally {
    isMyRankingLoading.value = false
  }
}

async function handleRefresh() {
  if (isRefreshing.value) {
    return
  }
  isRefreshing.value = true

  try {
    await refresh()
    ranking.value = data.value ?? []
    rankingError.value = error.value ? toApiError(error.value).message : ''
    if (ranking.value.length > 0) {
      lastUpdatedAt.value = new Date()
    }
    await loadMyRanking()
  }
  finally {
    isRefreshing.value = false
  }
}

const formattedUpdatedAt = computed(() =>
  lastUpdatedAt.value
    ? lastUpdatedAt.value.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '',
)

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

onMounted(() => {
  if (ranking.value.length > 0) {
    lastUpdatedAt.value = new Date()
  }
  loadMyRanking()
  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <main class="page-shell">
    <section class="ranking-shell">
      <header class="ranking-header">
        <div>
          <p class="eyebrow">
            Ranking
          </p>
          <h1>ランキング</h1>
        </div>
        <div class="ranking-update">
          <p
            v-if="formattedUpdatedAt"
            class="ranking-updated-at"
          >
            最終更新 {{ formattedUpdatedAt }}
          </p>
          <button
            type="button"
            class="ranking-refresh"
            :disabled="isRefreshing || status === 'pending'"
            @click="handleRefresh"
          >
            {{ isRefreshing ? '更新中…' : '更新する' }}
          </button>
        </div>
      </header>

      <p
        v-if="rankingError"
        class="status-message error"
        role="alert"
      >
        {{ rankingError }}
      </p>
      <p
        v-else-if="ranking.length === 0"
        class="muted-copy"
      >
        まだランキングがありません。
      </p>

      <template v-else>
        <RankingTopCards :entries="topThree" />
        <RankingList :entries="rest" />
      </template>

      <hr class="ranking-divider">

      <MyRankingPanel
        v-if="myUserId !== null"
        :entry="myRanking"
        :error-message="myRankingError"
        :loading="isMyRankingLoading"
      />
      <section
        v-else-if="myRankingNotFound"
        class="my-ranking"
        aria-label="参加登録の再案内"
      >
        <p class="my-ranking-label">
          あなたの順位
        </p>
        <p class="muted-copy">
          参加登録情報が見つかりませんでした。登録が削除されている可能性があります。
          もう一度参加登録すると、自分の順位がここに表示されます。
        </p>
        <NuxtLink class="primary-link" to="/users/new">
          もう一度参加登録する
        </NuxtLink>
      </section>
      <section
        v-else
        class="my-ranking"
        aria-label="参加登録へ案内"
      >
        <p class="my-ranking-label">
          あなたの順位
        </p>
        <p class="muted-copy">
          参加登録すると、自分の順位と獲得ポイントがここに表示されます。
        </p>
        <NuxtLink class="primary-link" to="/users/new">
          参加登録する
        </NuxtLink>
      </section>
    </section>
  </main>
</template>
