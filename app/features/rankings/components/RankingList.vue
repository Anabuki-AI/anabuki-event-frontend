<script setup lang="ts">
import type { RankingEntry } from '../types'

defineProps<{
  entries: RankingEntry[]
}>()
</script>

<template>
  <ol class="ranking-list">
    <li
      v-for="(entry, index) in entries"
      :key="index"
      class="ranking-list-item"
    >
      <span class="ranking-list-rank">{{ entry.rank }}位</span>
      <span class="ranking-list-name">{{ entry.userName }}</span>
      <span class="ranking-list-points">{{ entry.points.toLocaleString('ja-JP') }} pt</span>
    </li>
  </ol>
</template>
