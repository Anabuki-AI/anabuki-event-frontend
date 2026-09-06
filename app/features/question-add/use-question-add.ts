import { computed, onUnmounted, ref } from 'vue'

// 保存完了メッセージ表示までの擬似処理待ち時間（API未接続のためのダミー遅延）
const SAVE_DELAY_MS = 600

export function useQuestionAdd() {
  const questionText = ref('')
  const selectedFile = ref<File | null>(null)
  const previewUrl = ref<string | null>(null)
  const isSaving = ref(false)
  const savedMessage = ref<string | null>(null)

  let saveTimer: number | null = null

  const fileName = computed<string | null>(() => selectedFile.value?.name ?? null)
  const hasImage = computed<boolean>(() => selectedFile.value !== null)
  const canSave = computed<boolean>(() => !isSaving.value && questionText.value.trim().length > 0)

  function revokePreview() {
    if (previewUrl.value !== null) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }

  function clearSaveTimer() {
    if (saveTimer !== null) {
      window.clearTimeout(saveTimer)
      saveTimer = null
    }
  }

  function handleQuestionInput(value: string) {
    questionText.value = value
  }

  function handleImageSelect(file: File | null) {
    // ファイル未選択・画像以外は状態を変えず無視する
    if (file === null) return
    if (!file.type.startsWith('image/')) return

    clearImage()
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }

  function clearImage() {
    revokePreview()
    selectedFile.value = null
  }

  function save() {
    if (!canSave.value) return
    // TODO: API接続後、ここで問題登録APIを呼び出し、成功後にメッセージ表示と遷移を追加する
    isSaving.value = true
    savedMessage.value = null
    clearSaveTimer()
    saveTimer = window.setTimeout(() => {
      saveTimer = null
      savedMessage.value = '保存しました。'
      isSaving.value = false
    }, SAVE_DELAY_MS)
  }

  function cancel() {
    clearSaveTimer()
    questionText.value = ''
    clearImage()
    savedMessage.value = null
    isSaving.value = false
  }

  onUnmounted(() => {
    clearSaveTimer()
    revokePreview()
  })

  return {
    questionText,
    previewUrl,
    fileName,
    isSaving,
    savedMessage,
    canSave,
    hasImage,
    handleQuestionInput,
    handleImageSelect,
    clearImage,
    save,
    cancel,
  }
}
