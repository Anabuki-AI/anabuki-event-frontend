<script setup lang="ts">
import { myRankingViewState, formatMyRankingLine } from '~/features/rankings/components/MyRankingPanel'
import { formatListPoints, formatRank } from '~/features/rankings/components/RankingList'
import { rankingMedalFor } from '~/features/rankings/components/RankingTopCards'
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
        <!-- 上位3名のカード(旧RankingTopCards.vue) -->
        <ul class="ranking-top-cards">
          <li
            v-for="(entry, index) in topThree"
            :key="entry.userId"
            class="ranking-card"
          >
            <p class="ranking-card-medal">
              <span aria-hidden="true">{{ rankingMedalFor(index) }}</span>
              <span class="ranking-card-rank">{{ formatRank(entry.rank) }}</span>
            </p>
            <p class="ranking-card-name">
              {{ entry.userName }}
            </p>
            <p class="ranking-card-points">
              {{ entry.points.toLocaleString('ja-JP') }}<span class="ranking-card-unit">ポイント</span>
            </p>
          </li>
        </ul>

        <!-- 4位以下の一覧(旧RankingList.vue) -->
        <ol class="ranking-list">
          <li
            v-for="entry in rest"
            :key="entry.userId"
            class="ranking-list-item"
          >
            <span class="ranking-list-rank">{{ formatRank(entry.rank) }}</span>
            <span class="ranking-list-name">{{ entry.userName }}</span>
            <span class="ranking-list-points">{{ formatListPoints(entry.points) }}</span>
          </li>
        </ol>
      </template>

      <hr class="ranking-divider">

      <!-- 自分の順位パネル(旧MyRankingPanel.vue) -->
      <section
        v-if="myUserId !== null"
        class="my-ranking"
        aria-label="自分の順位"
        :aria-busy="isMyRankingLoading"
      >
        <p
          v-if="myRankingViewState(myRanking, myRankingError, isMyRankingLoading) === 'loading'"
          class="muted-copy"
        >
          順位を確認しています…
        </p>
        <p
          v-else-if="myRanking"
          class="my-ranking-line"
        >
          {{ formatMyRankingLine(myRanking) }}
        </p>
        <p
          v-else-if="myRankingError"
          class="status-message error"
          role="alert"
        >
          {{ myRankingError }}
        </p>
      </section>
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
