<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import type { Question } from '../types'
import { summarizeBulkDeleteImpact } from './QuestionRow'

const props = defineProps<{
  questions: Question[]
  isDeleting: boolean
  errorMessage: string
}>()
const emit = defineEmits<{ close: []; confirm: [] }>()

const cancelButton = ref<HTMLButtonElement | null>(null)
const titleId = useId()
const impact = computed(() => summarizeBulkDeleteImpact(props.questions))

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
    <section class="multiplier-modal-panel delete-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-busy="isDeleting" tabindex="-1">
      <h2 :id="titleId">選択した問題を一括削除しますか？</h2>
      <p>選択した {{ impact.total }} 問を削除します。この操作は元に戻せません。</p>
      <div v-if="impact.affected > 0" class="bulk-delete-warning" role="alert">
        <p class="bulk-delete-warning-title">
          選択した {{ impact.total }} 問のうち {{ impact.affected }} 問は、出題済み・回答済み・出題中のいずれかです。
        </p>
        <ul>
          <li v-if="impact.live > 0">出題中の問題: {{ impact.live }} 問(削除すると出題は待機状態に戻ります)</li>
          <li v-if="impact.revealed > 0">正解公開済みの問題: {{ impact.revealed }} 問</li>
          <li v-if="impact.answered > 0">参加者の回答・自信度の記録がある問題: {{ impact.answered }} 問</li>
        </ul>
        <p>これらを削除すると、参加者の回答・自信度の記録も一緒に削除され、元に戻せません。</p>
      </div>
      <p v-if="errorMessage" class="status-message error" role="alert">{{ errorMessage }}</p>
      <div class="multiplier-modal-actions">
        <button ref="cancelButton" type="button" class="button-cancel" :disabled="isDeleting" @click="emit('close')">キャンセル</button>
        <button type="button" class="delete-button" :disabled="isDeleting" @click="emit('confirm')">{{ isDeleting ? '削除中…' : `${impact.total}問を削除する` }}</button>
      </div>
    </section>
  </div>
</template>
