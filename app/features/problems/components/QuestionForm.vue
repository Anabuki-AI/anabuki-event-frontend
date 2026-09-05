<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { createQuestion, updateQuestion } from '../api/client'
import type { QuestionPayload } from '../api/client'
import { validateQuestionForm, hasFieldErrors, hasQuestionChanged } from '../validation'
import type { Question, QuestionFieldErrors, QuestionFormState } from '../types'
import { toApiError } from '~/lib/api/error'

const props = defineProps<{
  /** 編集時は対象問題を渡す。追加時は未指定 */
  question?: Question
}>()

const emit = defineEmits<{
  saved: [question: Question]
}>()

const isEdit = computed(() => props.question != null)

const initialForm: QuestionFormState = props.question
  ? {
      questionText: props.question.questionText,
      choices: { ...props.question.choices },
      correctAnswer: props.question.correctAnswer,
    }
  : {
      questionText: '',
      choices: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
    }

const form = reactive<QuestionFormState>(initialForm)
const baseline: QuestionFormState = JSON.parse(JSON.stringify(initialForm))

const showFieldErrors = ref(false)
const fieldErrors = ref<QuestionFieldErrors>({
  questionText: '',
  choices: { A: '', B: '', C: '', D: '' },
  correctAnswer: '',
})

const isSubmitting = ref(false)
const submitErrorMessage = ref('')
const savedQuestion = ref<Question | null>(null)

const isSubmitEnabled = computed(() => !isSubmitting.value && hasQuestionChanged(form, baseline))

function applyUpdate(next: QuestionFormState) {
  form.questionText = next.questionText
  form.choices = next.choices
  form.correctAnswer = next.correctAnswer
}

async function handleSubmit() {
  submitErrorMessage.value = ''
  savedQuestion.value = null
  fieldErrors.value = validateQuestionForm(form)

  if (hasFieldErrors(fieldErrors.value)) {
    showFieldErrors.value = true
    return
  }
  showFieldErrors.value = false
  isSubmitting.value = true

  const payload: QuestionPayload = {
    questionText: form.questionText,
    choices: { ...form.choices },
    correctAnswer: form.correctAnswer,
  }

  try {
    const saved = isEdit.value && props.question
      ? await updateQuestion(props.question.id, payload)
      : await createQuestion(payload)
    savedQuestion.value = saved
    emit('saved', saved)
  }
  catch (error) {
    submitErrorMessage.value = toApiError(error).message
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form
    class="user-form question-edit-form"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <QuestionFormFields
      :form="form"
      :field-errors="fieldErrors"
      :show-field-errors="showFieldErrors"
      :disabled="isSubmitting"
      @update="applyUpdate"
    />

    <div class="form-actions">
      <button
        type="submit"
        class="submit-button"
        :class="{ 'is-submitting': isSubmitting }"
        :disabled="!isSubmitEnabled"
      >
        {{ isSubmitting ? '保存中…' : '保存する' }}
      </button>
      <button
        type="button"
        class="button-cancel"
        :disabled="isSubmitting"
        @click="$router.back()"
      >
        キャンセル
      </button>
    </div>

    <p
      v-if="savedQuestion"
      class="status-message success"
      role="status"
    >
      {{ isEdit ? `問題を更新しました（Q${savedQuestion.id}）` : `問題を登録しました（Q${savedQuestion.id}）` }}
    </p>
    <p
      v-if="submitErrorMessage"
      class="status-message error"
      role="alert"
    >
      {{ submitErrorMessage }}
    </p>
  </form>
</template>
