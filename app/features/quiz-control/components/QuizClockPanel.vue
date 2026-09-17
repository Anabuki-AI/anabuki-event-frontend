<script setup lang="ts">
import { computed } from 'vue'
import { formatClock, formatElapsed } from '../useQuizClock'
import type { QuizState } from '../types'
import type { QuizHistoryEntry } from '../useQuizControl'

const props = defineProps<{
  state: QuizState
  now: Date
  history: QuizHistoryEntry[]
}>()

const recentHistory = computed(() => [...props.history].reverse())
const clock = computed(() => formatClock(props.now))
const primaryElapsed = computed(() => {
  const event = props.state.event
  if (!event) return { label: 'イベント開始からの経過', value: null }
  if (event.finishedAt) {
    return { label: '大会時間', value: formatElapsed(event.startedAt, new Date(event.finishedAt)) }
  }
  return { label: 'イベント開始からの経過', value: formatElapsed(event.startedAt, props.now) }
})
</script>

<template>
  <aside class="quiz-clock-panel" aria-label="時間表示">
    <div class="quiz-clock-block">
      <p class="quiz-clock-label">
        <span class="quiz-clock-live-dot" aria-hidden="true" />
        現在時刻
      </p>
      <p class="quiz-clock-time" role="timer" aria-live="off">
        {{ clock }}
      </p>
    </div>

    <div class="quiz-clock-block quiz-clock-block--elapsed">
      <p class="quiz-clock-label">
        {{ primaryElapsed.label }}
      </p>
      <p class="quiz-clock-elapsed" :class="{ 'is-pending': primaryElapsed.value === null }">
        {{ primaryElapsed.value ?? '未開始' }}
      </p>
    </div>

    <dl v-if="recentHistory.length" class="quiz-clock-log" aria-label="この画面で実行した進行ログ">
      <div
        v-for="entry in recentHistory"
        :key="`${entry.label}-${entry.time}`"
        class="quiz-clock-log-row"
      >
        <dt>{{ entry.label }}</dt>
        <dd>{{ new Date(entry.time).toLocaleTimeString('ja-JP') }}</dd>
      </div>
    </dl>
  </aside>
</template>
