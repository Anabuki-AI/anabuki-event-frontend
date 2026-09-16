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

/** 直近の出来事を先頭に表示する運営ログ */
const recentHistory = computed(() => [...props.history].reverse())

const clock = computed(() => formatClock(props.now))
/** 解答受付中: 公開からの経過。それ以外: 締切まで/答え表示からの経過 */
const primaryElapsed = computed(() => {
  if (props.state.publishedAt !== null && props.state.phase === 'PUBLISHING') {
    return { label: '公開からの経過', value: formatElapsed(props.state.publishedAt, props.now) }
  }
  if (props.state.phase === 'CLOSED' && props.state.closedAt !== null) {
    return { label: '締め切り時刻からの経過', value: formatElapsed(props.state.closedAt, props.now) }
  }
  if (props.state.phase === 'REVEALED' && props.state.revealedAt !== null) {
    return { label: '答え表示からの経過', value: formatElapsed(props.state.revealedAt, props.now) }
  }
  if (props.state.startedAt !== null) {
    return { label: 'イベント開始からの経過', value: formatElapsed(props.state.startedAt, props.now) }
  }
  return { label: 'イベント開始からの経過', value: null }
})

</script>

<template>
  <aside
    class="quiz-clock-panel"
    aria-label="時間表示"
  >
    <div class="quiz-clock-block">
      <p class="quiz-clock-label">
        <span class="quiz-clock-live-dot" aria-hidden="true" />
        現在時刻
      </p>
      <p
        class="quiz-clock-time"
        role="timer"
        aria-live="off"
      >
        {{ clock }}
      </p>
    </div>

    <div class="quiz-clock-block quiz-clock-block--elapsed">
      <p class="quiz-clock-label">
        {{ primaryElapsed.label }}
      </p>
      <p
        class="quiz-clock-elapsed"
        :class="{ 'is-pending': primaryElapsed.value === null }"
      >
        {{ primaryElapsed.value ?? '未開始' }}
      </p>
    </div>

    <dl
      v-if="recentHistory.length"
      class="quiz-clock-log"
      aria-label="進行ログ（問題ごとの時刻）"
    >
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
