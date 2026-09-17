<script setup lang="ts">
import { computed, watch } from 'vue'
import { computeCountdown, createExpireGuard, formatElapsed, formatElapsedSeconds } from '../useQuizClock'
import type { QuizPhase } from '../types'

const props = defineProps<{
  phase: QuizPhase | null
  phaseStartedAt: string | null
  finishedElapsedSeconds: number | null
  timeLimitSeconds: number | null
  /** カウントダウンの発火ガードを問題単位でリセットするためのキー。 */
  questionId: number | null
  now: Date
  /** 別の進行操作が終わるまで自動締め切りを保留する。 */
  isActing?: boolean
}>()

const emit = defineEmits<{
  /** 残り時間が0になった瞬間に一度だけ発火する。呼び出し側は「解答締め切り」相当の操作を呼ぶこと。 */
  expire: []
}>()

const elapsedLabel = computed(() => {
  if (props.phase === 'FINISHED') {
    return props.finishedElapsedSeconds === null
      ? '--:--'
      : formatElapsedSeconds(props.finishedElapsedSeconds)
  }
  return formatElapsed(props.phaseStartedAt, props.now)
})
const countdown = computed(() => computeCountdown(props.phaseStartedAt, props.timeLimitSeconds, props.now))

const expireGuard = createExpireGuard()

watch(
  [countdown, () => props.phase, () => props.questionId, () => props.isActing],
  ([current]) => {
    // 解答受付中(PUBLISHED)以外での期限切れは締め切り操作の対象外なので何もしない。
    if (props.phase !== 'PUBLISHED') return
    if (props.isActing) return
    if (!current.hasLimit) return

    const key = `${props.questionId ?? 'none'}:${props.phaseStartedAt ?? 'none'}`
    if (expireGuard.shouldFire(key, current.remainingSeconds)) {
      emit('expire')
    }
  },
  // 表示直後(ページ再読み込み直後など)にすでに残り時間が0のケースも取りこぼさないようにする。
  { immediate: true },
)
</script>

<template>
  <section class="quiz-timer-panel" aria-label="タイマー">
    <div class="quiz-timer-block">
      <p class="quiz-timer-label">
        経過時間
      </p>
      <p class="quiz-timer-elapsed" role="timer" aria-live="off">
        {{ elapsedLabel }}
      </p>
    </div>

    <div
      class="quiz-timer-block quiz-timer-countdown"
      :class="`is-${countdown.urgency}`"
    >
      <p class="quiz-timer-label">
        残り時間
      </p>
      <p
        v-if="countdown.hasLimit"
        class="quiz-timer-remaining"
        role="timer"
        aria-live="polite"
      >
        {{ countdown.remainingLabel }}
      </p>
      <p v-else class="quiz-timer-no-limit">
        制限時間なし
      </p>
    </div>
  </section>
</template>
