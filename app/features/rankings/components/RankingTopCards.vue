<script setup lang="ts">
import type { RankingEntry } from '../types'

const MEDALS = ['🥇', '🥈', '🥉'] as const

defineProps<{
  entries: RankingEntry[]
}>()
</script>

<template>
  <ul class="ranking-top-cards">
    <li
      v-for="(entry, index) in entries"
      :key="index"
      class="ranking-card"
    >
      <p class="ranking-card-medal">
        <span aria-hidden="true">{{ MEDALS[index] ?? '🏅' }}</span>
        <span class="ranking-card-rank">{{ entry.rank }}位</span>
      </p>
      <p class="ranking-card-name">
        {{ entry.userName }}
      </p>
      <p class="ranking-card-points">
        {{ entry.points.toLocaleString('ja-JP') }}<span class="ranking-card-unit">ポイント</span>
      </p>
    </li>
  </ul>
</template>
