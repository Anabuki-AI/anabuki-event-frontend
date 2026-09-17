<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { getNextQuizPosition, getQuizPhase } from '../types'
import type { QuizPhase, OperatorQuizState } from '../types'

const props = defineProps<{
  state: OperatorQuizState
  isActing: boolean
}>()

const emit = defineEmits<{
  start: []
  publish: []
  close: []
  reveal: []
  finish: []
}>()

const STEPS = [
  { key: 'start', label: 'イベント開始' },
  { key: 'publish', label: '問題公開' },
  { key: 'close', label: '解答締め切り' },
  { key: 'reveal', label: '答え表示' },
  { key: 'finish', label: 'クイズ終了' },
] as const

interface StepView {
  key: typeof STEPS[number]['key']
  label: string
  state: 'done' | 'current' | 'todo'
}

const phase = computed(() => getQuizPhase(props.state))
const nextPosition = computed(() => getNextQuizPosition(props.state))
const phaseIndex: Record<QuizPhase, number> = {
  IDLE: 0,
  PUBLISHED: 2,
  CLOSING: 2,
  CLOSED: 3,
  REVEALED: 4,
  FINISHED: 5,
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
      return { key: 'start', label: 'イベント開始', hint: 'イベントを開始すると最初の問題が公開されます。' }
    case 'PUBLISHED':
      return { key: 'close', label: '解答締め切り', hint: '参加者の解答受付を締め切ります。' }
    case 'CLOSING':
      return null
    case 'CLOSED':
      return { key: 'reveal', label: '答え表示', hint: '正解を参加者に表示します。' }
    case 'REVEALED':
      // 次の問題の内容は QuizNextQuestionPreview に表示するため、ここでは番号を重複表示しない。
      return nextPosition.value !== null
        ? { key: 'publish', label: '次の問題を公開', hint: '下の「次の問題」を確認し、準備ができたら公開してください。' }
        : { key: 'finish', label: 'クイズを終了', hint: '全ての問題が終わりました。クイズ大会を終了します。' }
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
      break
    case 'finish':
      emit('finish')
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
      {{ phase === 'CLOSING' ? '解答締め切りのカウントダウン中です。' : phase === 'FINISHED' ? 'クイズ大会は終了しました。お疲れさまでした。' : '進行できる操作はありません。' }}
    </p>
  </section>
</template>
