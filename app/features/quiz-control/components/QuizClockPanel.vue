<script setup lang="ts">
import { computed } from 'vue'
import { formatClock } from '../useQuizClock'
import type { OperatorQuizState } from '../types'
import type { QuizHistoryEntry } from '../useQuizControl'

const props = defineProps<{
  state: OperatorQuizState
  now: Date
  history: QuizHistoryEntry[]
}>()

const recentHistory = computed(() => [...props.history].reverse())
const clock = computed(() => formatClock(props.now))
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
        参加者数
      </p>
      <p class="quiz-clock-elapsed">
        {{ state.total_participants }}<span> 人</span>
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
