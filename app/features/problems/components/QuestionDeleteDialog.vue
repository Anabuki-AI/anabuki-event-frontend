<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import type { Question } from '../types'
import { formatQuestionPosition } from './QuestionRow'

const props = defineProps<{
  question: Question
  isDeleting: boolean
  errorMessage: string
}>()
const emit = defineEmits<{ close: []; confirm: [] }>()

const panel = ref<HTMLElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
const titleId = useId()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.isDeleting) emit('close')
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  cancelButton.value?.focus()
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="multiplier-modal" @click.self="!isDeleting && emit('close')">
    <section ref="panel" class="multiplier-modal-panel delete-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-busy="isDeleting" tabindex="-1">
      <h2 :id="titleId">問題を削除しますか？</h2>
      <p>
        {{ formatQuestionPosition(question.position) }}「{{ question.questionText }}」を削除します。この操作は元に戻せません。
      </p>
      <p v-if="errorMessage" class="status-message error" role="alert">{{ errorMessage }}</p>
      <div class="multiplier-modal-actions">
        <button ref="cancelButton" type="button" class="button-cancel" :disabled="isDeleting" @click="emit('close')">キャンセル</button>
        <button type="button" class="delete-button" :disabled="isDeleting" @click="emit('confirm')">{{ isDeleting ? '削除中…' : '削除する' }}</button>
      </div>
    </section>
  </div>
</template>
