<script setup lang="ts">
import { computed } from 'vue'
import { computeCountdown } from '~/features/quiz-control/useQuizClock'

const CLOSE_DELAY_SECONDS = 10

const props = defineProps<{
  phase: string | null | undefined
  phaseStartedAt: string | null | undefined
  now: Date
}>()

const countdown = computed(() => computeCountdown(
  props.phaseStartedAt,
  CLOSE_DELAY_SECONDS,
  props.now,
))
const isClosing = computed(() => props.phase === 'closing' && countdown.value.hasLimit)
const progressWidth = computed(() => `${Math.round((countdown.value.remainingRatio ?? 0) * 100)}%`)
</script>

<template>
  <section
    v-if="isClosing"
    class="quiz-close-countdown"
    aria-label="解答締め切りまでのカウントダウン"
  >
    <div class="quiz-close-countdown__heading">
      <p>解答締め切りまで</p>
      <strong role="timer" aria-live="polite">あと {{ countdown.remainingLabel }}</strong>
    </div>
    <div class="quiz-close-countdown__track" aria-hidden="true">
      <span class="quiz-close-countdown__progress" :style="{ width: progressWidth }" />
    </div>
    <p class="quiz-close-countdown__notice">
      まもなく解答受付を終了します。
    </p>
  </section>
</template>

<style scoped>
.quiz-close-countdown {
  display: grid;
  gap: 8px;
  padding: 12px 16px;
  color: #132238;
  background: #ffffff;
  border-bottom: 1px solid #c7d3e0;
  box-shadow: 0 2px 10px rgb(19 34 56 / 10%);
}

.quiz-close-countdown__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.quiz-close-countdown__heading p,
.quiz-close-countdown__notice {
  margin: 0;
}

.quiz-close-countdown__heading p,
.quiz-close-countdown__notice {
  color: #516176;
  font-size: 13px;
  font-weight: 700;
}

.quiz-close-countdown__heading strong {
  color: #1769c2;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.quiz-close-countdown__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #d6ddea;
}

.quiz-close-countdown__progress {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #1769c2;
  transition: width 200ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .quiz-close-countdown__progress {
    transition: none;
  }
}
</style>
