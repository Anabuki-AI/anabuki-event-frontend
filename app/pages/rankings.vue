<script setup lang="ts">
import MyRankingPanel from '~/features/rankings/components/MyRankingPanel.vue'
import RankingList from '~/features/rankings/components/RankingList.vue'
import RankingTopCards from '~/features/rankings/components/RankingTopCards.vue'
import { useRankings } from '~/features/rankings/composables/use-rankings'

useSeoMeta({
  title: 'ランキング',
  description: 'クイズ参加者の獲得ポイントランキングです。',
})

const {
  topThree,
  rest,
  rankingError,
  ranking,
  status,
  myRanking,
  myUserId,
  myRankingError,
  myRankingNotFound,
  isMyRankingLoading,
  isRefreshing,
  formattedUpdatedAt,
  handleRefresh,
} = await useRankings()
</script>

<template>
  <main class="ranking-page">
    <header class="quiz-header">
      <p class="quiz-header-title">
        クイズ大会
      </p>
    </header>
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
