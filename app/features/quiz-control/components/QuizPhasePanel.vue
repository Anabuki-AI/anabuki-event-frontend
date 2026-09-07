<script setup lang="ts">
import { computed } from 'vue'
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

/** 進行ステップの定義。答え表示後に次の問題公開へ戻る */
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

const steps = computed<StepView[]>(() => {
  const phase = props.state.phase
  const currentIndex: Record<QuizPhase, number> = {
    IDLE: 0,
    PUBLISHING: 1,
    CLOSED: 2,
    REVEALED: 3,
    ENDED: 4,
  }
  const idx = currentIndex[phase]
  return STEPS.map((step, i) => ({
    key: step.key,
    label: step.label,
    state: i < idx ? 'done' : i === idx ? 'current' : 'todo',
  }))
})

const action = computed(() => {
  switch (props.state.phase) {
    case 'IDLE':
      return props.state.startedAt === null
        ? { key: 'start', label: 'イベント開始', hint: 'イベントを開始すると問題を公開できるようになります。' }
        : { key: 'publish', label: '問題公開', hint: '次の問題を公開して解答を受け付けます。' }
    case 'PUBLISHING':
      return { key: 'close', label: '解答締め切り', hint: '参加者の解答受付を締め切ります。' }
    case 'CLOSED':
      return { key: 'reveal', label: '答え表示', hint: '正解と解説を参加者に表示します。' }
    case 'REVEALED':
      return props.state.nextQuestion !== null
        ? { key: 'publish', label: '次の問題を公開', hint: `次は Q${props.state.nextQuestion.id} です。` }
        : null
    case 'ENDED':
      return null
    default:
      return null
  }
})

function handleAction() {
  if (action.value === null || props.isActing) {
    return
  }
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
      break
  }
}
</script>

<template>
  <section class="quiz-phase-panel">
    <ol
      class="quiz-phase-steps"
      aria-label="進行状況"
    >
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="quiz-phase-step"
        :class="`is-${step.state}`"
      >
        <span
          class="quiz-phase-marker"
          aria-hidden="true"
        >{{ step.state === 'done' ? '✓' : index + 1 }}</span>
        <span class="quiz-phase-label">{{ step.label }}</span>
      </li>
    </ol>

    <div
      v-if="action"
      class="quiz-phase-action"
    >
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
    <p
      v-else
      class="quiz-phase-done"
      role="status"
    >
      すべての問題を出題し終えました。お疲れさまでした。
    </p>
  </section>
</template>
