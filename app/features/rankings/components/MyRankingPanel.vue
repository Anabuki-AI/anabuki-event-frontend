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
    <p
      v-if="loading"
      class="muted-copy"
    >
      順位を確認しています…
    </p>

    <p
      v-else-if="entry"
      class="my-ranking-line"
    >
      {{ entry.rank }}位 あなたは {{ entry.points.toLocaleString('ja-JP') }}ポイント
    </p>

    <p
      v-else-if="errorMessage"
      class="status-message error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </section>
</template>
