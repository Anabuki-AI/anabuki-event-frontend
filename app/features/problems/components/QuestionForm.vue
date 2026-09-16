<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import QuestionFormFields from './QuestionFormFields.vue'
import { createQuestion, updateQuestion } from '../api/client'
import type { QuestionPayload } from '../api/client'
import {
  emptyQuestionFieldErrors,
  hasFieldErrors,
  hasQuestionChanged,
  mapQuestionFieldErrors,
  problemErrorMessage,
  validateQuestionForm,
} from '../validation'
import type { Question, QuestionFieldErrors, QuestionFormState } from '../types'
import { toApiError } from '~/lib/api/error'

const props = defineProps<{ question?: Question }>()

const isEdit = computed(() => props.question != null)
const router = useRouter()

const initialForm: QuestionFormState = props.question
  ? {
      questionText: props.question.questionText,
      choices: {
        A: props.question.choiceA,
        B: props.question.choiceB,
        C: props.question.choiceC,
        D: props.question.choiceD,
      },
      correctAnswer: props.question.correctAnswer,
    }
  : {
      questionText: '',
      choices: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
    }

const form = reactive<QuestionFormState>({
  questionText: initialForm.questionText,
  choices: { ...initialForm.choices },
  correctAnswer: initialForm.correctAnswer,
})
const baseline: QuestionFormState = {
  questionText: initialForm.questionText,
  choices: { ...initialForm.choices },
  correctAnswer: initialForm.correctAnswer,
}

const showFieldErrors = ref(false)
const fieldErrors = ref<QuestionFieldErrors>(emptyQuestionFieldErrors())
const isSubmitting = ref(false)
const submitErrorMessage = ref('')

const isSubmitEnabled = computed(() => !isSubmitting.value && hasQuestionChanged(form, baseline))

function applyUpdate(next: QuestionFormState) {
  form.questionText = next.questionText
  form.choices = next.choices
  form.correctAnswer = next.correctAnswer
}

function handleCancel() {
  void router.push('/admin/problems')
}

async function handleSubmit() {
  if (isSubmitting.value) return

  submitErrorMessage.value = ''
  fieldErrors.value = validateQuestionForm(form)
  if (hasFieldErrors(fieldErrors.value)) {
    showFieldErrors.value = true
    return
  }

  showFieldErrors.value = false
  isSubmitting.value = true
  const payload: QuestionPayload = {
    questionText: form.questionText.trim(),
    choiceA: form.choices.A.trim(),
    choiceB: form.choices.B.trim(),
    choiceC: form.choices.C.trim(),
    choiceD: form.choices.D.trim(),
    correctAnswer: form.correctAnswer,
  }

  try {
    if (isEdit.value && props.question) {
      await updateQuestion(props.question.id, payload)
    }
    else {
      await createQuestion(payload)
    }
    await router.push('/admin/problems')
  }
  catch (error) {
    const apiError = toApiError(error)
    if (apiError.statusCode === 422) {
      fieldErrors.value = mapQuestionFieldErrors(apiError.fieldErrors)
      showFieldErrors.value = hasFieldErrors(fieldErrors.value)
    }
    submitErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="user-form question-edit-form" novalidate @submit.prevent="handleSubmit">
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
      <button type="button" class="button-cancel" :disabled="isSubmitting" @click="handleCancel">
        キャンセル
      </button>
    </div>

    <p v-if="submitErrorMessage" class="status-message error" role="alert">
      {{ submitErrorMessage }}
    </p>
  </form>
</template>
