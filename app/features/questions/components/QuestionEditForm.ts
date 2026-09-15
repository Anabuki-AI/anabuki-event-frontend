import type { QuestionFieldErrors, QuestionFormState } from '../types'
import { computed, reactive, ref } from 'vue'
import { navigateTo, useRouter } from '#imports'
import {
  CANEL_FALLBACK_ROUTE,
  MOCK_QUESTION,
  SAVE_DELAY_MS,
} from '../definitions'
import {
  hasQuestionChanged,
  validateCorrectAnswer,
  validateRequiredText,
} from '../validation'

function cloneFormState(source: QuestionFormState): QuestionFormState {
  return {
    questionText: source.questionText,
    choices: { ...source.choices },
    correctAnswer: source.correctAnswer,
  }
}

/**
 * 問題編集フォームの状態と保存/キャンセル処理。
 * テンプレートはpages/QuestionEdit.vue。バックエンドの問題APIは未実装のため
 * 保存は疑似遅延のモック(SAVE_DELAY_MS)。
 */
export function setupQuestionEdit() {
  // TODO: バックエンドの問題取得API実装後は取得データで初期化する
  const form = reactive<QuestionFormState>(cloneFormState({
    questionText: MOCK_QUESTION.questionText,
    choices: { ...MOCK_QUESTION.choices },
    correctAnswer: MOCK_QUESTION.correctAnswer,
  }))

  // 初期値スナップショット(キャンセルガード・保存後のisDirtyリセットに使用)
  let baseline: QuestionFormState = cloneFormState(form)

  const isDirty = computed(() => hasQuestionChanged(form, baseline))

  const showFieldErrors = ref(false)

  const fieldErrors = computed<QuestionFieldErrors>(() => ({
    questionText: validateRequiredText(form.questionText, '問題文'),
    choices: {
      A: validateRequiredText(form.choices.A, '選択肢A'),
      B: validateRequiredText(form.choices.B, '選択肢B'),
      C: validateRequiredText(form.choices.C, '選択肢C'),
      D: validateRequiredText(form.choices.D, '選択肢D'),
    },
    correctAnswer: validateCorrectAnswer(form.correctAnswer),
  }))

  const isSubmitting = ref(false)
  const submitErrorMessage = ref('')
  const savedMessage = ref('')

  const isSubmitEnabled = computed(() => !isSubmitting.value && (
    fieldErrors.value.questionText === ''
    && fieldErrors.value.choices.A === ''
    && fieldErrors.value.choices.B === ''
    && fieldErrors.value.choices.C === ''
    && fieldErrors.value.choices.D === ''
    && fieldErrors.value.correctAnswer === ''
  ))

  async function handleSubmit() {
    showFieldErrors.value = true
    if (!isSubmitEnabled.value) {
      return
    }
    isSubmitting.value = true
    submitErrorMessage.value = ''
    savedMessage.value = ''

    try {
      // TODO: バックエンドの問題更新API実装後は実API呼び出しに差し替える
      await new Promise(resolve => setTimeout(resolve, SAVE_DELAY_MS))
      baseline = cloneFormState(form)
      savedMessage.value = '保存しました'
    }
    catch (error) {
      submitErrorMessage.value = error instanceof Error ? error.message : '保存に失敗しました'
    }
    finally {
      isSubmitting.value = false
    }
  }

  // キャンセル=「編集を破棄して一つ前の画面へ戻る」。戻るリンクと同じsetupQuestionBackを使う
  const { handleBack } = setupQuestionBack(() => {
    if (!isDirty.value) {
      return true
    }
    return window.confirm('編集内容を破棄して戻りますか?')
  })
  const handleCancel = handleBack

  return {
    form,
    fieldErrors,
    showFieldErrors,
    isSubmitting,
    isSubmitEnabled,
    submitErrorMessage,
    savedMessage,
    handleSubmit,
    handleCancel,
  }
}
/**
 * 「一つ前の画面へ戻る」共通挙動。
 * 戻るリンク・キャンセルボタンの双方から呼ばれる。
 * onNoHistory: 履歴がない場合に実行するガード。falseを返すと遷移しない
 */
export function setupQuestionBack(onNoHistory?: () => boolean) {
  const router = useRouter()

  function handleBack() {
    if (window.history.state?.back) {
      router.back()
      return
    }
    // 履歴がない場合: 追加処理(ガード)がfalseを返したら遷移しない
    if (onNoHistory && onNoHistory() === false) {
      return
    }
    navigateTo(CANEL_FALLBACK_ROUTE)
  }

  return {
    handleBack,
  }
}
