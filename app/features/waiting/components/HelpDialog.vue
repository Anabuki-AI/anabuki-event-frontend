<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId } from 'vue'

const emit = defineEmits<{
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const titleId = useId()

onMounted(() => {
  panelRef.value?.focus()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div
    class="help-dialog"
    @click.self="emit('close')"
  >
    <div
      ref="panelRef"
      class="help-dialog-panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <h2 :id="titleId">ヘルプ</h2>
      <ul>
        <li>この画面はイベントの待機画面です。</li>
        <li>参加人数は自動で更新されます。</li>
        <li>リアクションボタンで気持ちを伝えられます。</li>
        <li>クイズが開始されると、画面は自動的に切り替わります。</li>
        <li>ニックネームを変更したいときは、名前の横の✏️ボタンを押してください。</li>
      </ul>
      <button
        type="button"
        class="help-dialog-close"
        @click="emit('close')"
      >
        閉じる
      </button>
    </div>
  </div>
</template>
