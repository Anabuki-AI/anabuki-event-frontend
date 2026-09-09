import { onMounted, onUnmounted, ref } from 'vue'

/**
 * ヘルプダイアログの状態とキーボード操作(旧HelpDialog.vueのscript)。
 * テンプレートはpages/users/waiting.vueに統合済み。
 */
export function setupHelpDialog(onClose: () => void) {
  const panelRef = ref<HTMLElement | null>(null)
  const titleId = useId()

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  onMounted(() => {
    panelRef.value?.focus()
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    panelRef,
    titleId,
    handleKeydown,
  }
}
