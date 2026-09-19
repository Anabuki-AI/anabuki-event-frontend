<script setup lang="ts">
import { formatMyRankingLine } from '~/features/rankings/components/MyRankingPanel'
import { formatPoints, formatRank } from '~/features/rankings/components/RankingList'
import { rankingMedalFor } from '~/features/rankings/components/RankingTopCards'
import LoadingSkeleton from '~/components/LoadingSkeleton.vue'
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
  isRefreshing,
  formattedUpdatedAt,
  handleRefresh,
} = useRankings()
</script>

<template>
  <main class="ranking-page">
    <header class="quiz-header">
      <p class="quiz-header-title">
        クイズ大会
      </p>
    </header>
    <section
      class="ranking-shell"
      :aria-busy="status === 'pending'"
    >
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
      <div
        v-else-if="status === 'pending' && ranking.length === 0"
        class="ranking-loading"
        role="status"
        aria-busy="true"
        aria-label="ランキングを読み込み中"
      >
        <span class="visually-hidden">ランキングを読み込み中…</span>
        <ul class="ranking-top-cards ranking-skeleton-cards">
          <li v-for="index in 3" :key="index" class="ranking-card">
            <LoadingSkeleton class="ranking-skeleton-rank" />
            <LoadingSkeleton class="ranking-skeleton-name" />
            <LoadingSkeleton class="ranking-skeleton-points" />
          </li>
        </ul>
        <ol class="ranking-list ranking-skeleton-list">
          <li v-for="index in 4" :key="index" class="ranking-list-item">
            <LoadingSkeleton class="ranking-skeleton-list-rank" />
            <LoadingSkeleton class="ranking-skeleton-list-name" />
          </li>
        </ol>
      </div>
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
            :key="entry.participantId"
            class="ranking-card"
          >
            <p class="ranking-card-medal">
              <span aria-hidden="true">{{ rankingMedalFor(index) }}</span>
              <span class="ranking-card-rank">{{ formatRank(entry.rank) }}</span>
            </p>
            <p class="ranking-card-name">
              {{ entry.displayName }}
            </p>
            <p class="ranking-card-points">
              {{ formatPoints(entry.totalPoints) }}
            </p>
          </li>
        </ul>

        <!-- 4位以下の一覧(旧RankingList.vue) -->
        <ol class="ranking-list">
          <li
            v-for="entry in rest"
            :key="entry.participantId"
            class="ranking-list-item"
          >
            <span class="ranking-list-rank">{{ formatRank(entry.rank) }}</span>
            <span class="ranking-list-name">{{ entry.displayName }}</span>
            <span class="ranking-list-points">{{ formatPoints(entry.totalPoints) }}</span>
          </li>
        </ol>
      </template>

      <hr class="ranking-divider">

      <!-- 自分の順位パネル(旧MyRankingPanel.vue)。me は参加者セッションがあるときだけ返る -->
      <section
        v-if="myRanking"
        class="my-ranking"
        aria-label="自分の順位"
      >
        <p class="my-ranking-line">
          {{ formatMyRankingLine(myRanking) }}
        </p>
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
          参加登録すると、あなたの順位がここに表示されます。
        </p>
        <NuxtLink class="primary-link" to="/participants/new">
          参加登録する
        </NuxtLink>
      </section>
    </section>
  </main>
</template>
