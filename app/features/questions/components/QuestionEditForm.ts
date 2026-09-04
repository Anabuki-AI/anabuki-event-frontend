import type { QuestionFieldErrors, QuestionFormState } from '../types'
import { computed, reactive, ref } from 'vue'
import { navigateTo, useRouter } from '#imports'
import {
  CANCEL_ROUTE,
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

  const router = useRouter()

  function handleCancel() {
    if (isDirty.value && !window.confirm('編集内容を破棄して戻りますか?')) {
      return
    }
    // 履歴があれば前画面へ、なければ定義済みルートへ(直接URLアクセス対策)
    if (window.history.state?.back) {
      router.back()
    }
    else {
      navigateTo(CANCEL_ROUTE)
    }
  }

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
