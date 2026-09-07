<script setup lang="ts">
import { computed } from 'vue'
import { formatClock, formatElapsed } from '../useQuizClock'
import type { QuizState } from '../types'

const props = defineProps<{
  state: QuizState
  now: Date
}>()

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
  return { label: 'イベント開始からの経過', value: '--:--' }
})
</script>

<template>
  <aside
    class="quiz-clock-panel"
    aria-label="時間表示"
  >
    <p class="quiz-clock-label">
      現在時刻
    </p>
    <p
      class="quiz-clock-time"
      role="timer"
      aria-live="off"
    >
      {{ clock }}
    </p>

    <div class="quiz-clock-divider" />

    <p class="quiz-clock-label">
      {{ primaryElapsed.label }}
    </p>
    <p class="quiz-clock-elapsed">
      {{ primaryElapsed.value }}
    </p>

    <dl class="quiz-clock-log">
      <div
        v-if="state.startedAt"
        class="quiz-clock-log-row"
      >
        <dt>イベント開始</dt>
        <dd>{{ new Date(state.startedAt).toLocaleTimeString('ja-JP') }}</dd>
      </div>
      <div
        v-if="state.publishedAt && state.phase === 'PUBLISHING'"
        class="quiz-clock-log-row"
      >
        <dt>問題公開</dt>
        <dd>{{ new Date(state.publishedAt).toLocaleTimeString('ja-JP') }}</dd>
      </div>
      <div
        v-if="state.closedAt"
        class="quiz-clock-log-row"
      >
        <dt>解答締め切り</dt>
        <dd>{{ new Date(state.closedAt).toLocaleTimeString('ja-JP') }}</dd>
      </div>
      <div
        v-if="state.revealedAt"
        class="quiz-clock-log-row"
      >
        <dt>答え表示</dt>
        <dd>{{ new Date(state.revealedAt).toLocaleTimeString('ja-JP') }}</dd>
      </div>
    </dl>
  </aside>
</template>
