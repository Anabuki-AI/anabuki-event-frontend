<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { getNextQuizQuestion, getQuizPhase } from '../types'
import type { QuizPhase, QuizState } from '../types'

const props = defineProps<{
  state: QuizState
  isActing: boolean
}>()

const emit = defineEmits<{
  start: []
  publish: []
  close: []
  reveal: []
}>()

const STEPS = [
  { key: 'start', label: 'イベント開始' },
  { key: 'publish', label: '問題公開' },
  { key: 'close', label: '解答締め切り' },
  { key: 'reveal', label: '答え表示' },
] as const

interface StepView {
  key: typeof STEPS[number]['key']
  label: string
  state: 'done' | 'current' | 'todo'
}

const phase = computed(() => getQuizPhase(props.state))
const nextQuestion = computed(() => getNextQuizQuestion(props.state))
const phaseIndex: Record<QuizPhase, number> = {
  IDLE: 0,
  READY: 1,
  PUBLISHED: 2,
  CLOSED: 3,
  REVEALED: 4,
  FINISHED: 4,
}

const steps = computed<StepView[]>(() => {
  const currentIndex = phaseIndex[phase.value]
  return STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo',
  }))
})

const action = computed(() => {
  switch (phase.value) {
    case 'IDLE':
      return { key: 'start', label: 'イベント開始', hint: 'イベントを開始すると問題を公開できるようになります。' }
    case 'READY':
      return nextQuestion.value ? { key: 'publish', label: '問題公開', hint: `Q${nextQuestion.value.position} を公開して解答を受け付けます。` } : null
    case 'PUBLISHED':
      return { key: 'close', label: '解答締め切り', hint: '参加者の解答受付を締め切ります。' }
    case 'CLOSED':
      return { key: 'reveal', label: '答え表示', hint: '正解と得点を参加者に表示します。' }
    case 'REVEALED':
      return nextQuestion.value ? { key: 'publish', label: '次の問題を公開', hint: `次は Q${nextQuestion.value.position} です。` } : null
    default:
      return null
  }
})

const stepsListEl = ref<HTMLOListElement | null>(null)
watch(phase, () => {
  nextTick(() => {
    stepsListEl.value?.querySelector('.is-current')?.scrollIntoView({ inline: 'end', block: 'nearest' })
  })
}, { immediate: true })

function handleAction() {
  if (!action.value || props.isActing) return

  switch (action.value.key) {
    case 'start':
      emit('start')
      break
    case 'publish':
      emit('publish')
      break
    case 'close':
      emit('close')
      break
    case 'reveal':
      emit('reveal')
  }
}
</script>

<template>
  <section class="quiz-phase-panel">
    <ol ref="stepsListEl" class="quiz-phase-steps" aria-label="進行状況">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="quiz-phase-step"
        :class="`is-${step.state}`"
      >
        <span class="quiz-phase-marker" aria-hidden="true">{{ step.state === 'done' ? '✓' : index + 1 }}</span>
        <span class="quiz-phase-label">{{ step.label }}</span>
      </li>
    </ol>

    <div v-if="action" class="quiz-phase-action">
      <p class="quiz-phase-hint">
        {{ action.hint }}
      </p>
      <button
        type="button"
        class="quiz-action-button"
        :disabled="isActing"
        @click="handleAction"
      >
        {{ isActing ? '処理中…' : action.label }}
      </button>
    </div>
    <p v-else class="quiz-phase-done" role="status">
      {{ phase === 'FINISHED' ? 'クイズ大会は終了しました。お疲れさまでした。' : '進行できる問題はありません。' }}
    </p>
  </section>
</template>
