<script setup lang="ts">
import type { RankingEntry } from '../types'

withDefaults(
  defineProps<{
    entry: RankingEntry | null
    errorMessage?: string
    loading?: boolean
  }>(),
  {
    errorMessage: '',
    loading: false,
  },
)
</script>

<template>
  <section
    class="my-ranking"
    aria-label="自分の順位"
    :aria-busy="loading"
  >
    <template v-if="loading">
      <p class="my-ranking-label">
        あなたの順位
      </p>
      <p class="muted-copy">
        順位を確認しています…
      </p>
    </template>

    <template v-else-if="entry">
      <p class="my-ranking-label">
        あなたの順位
      </p>
      <div class="my-ranking-body">
        <p class="my-ranking-rank">
          {{ entry.rank }}<span class="my-ranking-rank-unit">位</span>
        </p>
        <div class="my-ranking-detail">
          <p class="my-ranking-name">
            {{ entry.userName }}
          </p>
          <p class="my-ranking-points">
            {{ entry.points.toLocaleString('ja-JP') }} pt
          </p>
        </div>
      </div>
    </template>

    <p
      v-else-if="errorMessage"
      class="status-message error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </section>
</template>
