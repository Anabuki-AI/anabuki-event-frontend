<script setup lang="ts">
import { computed } from 'vue'
import { CHOICE_KEYS, QUESTION_TEXT_MAX, CHOICE_TEXT_MAX } from '../constants'
import type { ChoiceKey, QuestionFieldErrors, QuestionFormState } from '../types'

const props = defineProps<{
  form: QuestionFormState
  fieldErrors: QuestionFieldErrors
  showFieldErrors: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  update: [form: QuestionFormState]
}>()

const local = computed(() => props.form)

function updateText(value: string) {
  emit('update', { ...local.value, questionText: value })
}

function updateChoice(key: ChoiceKey, value: string) {
  emit('update', { ...local.value, choices: { ...local.value.choices, [key]: value } })
}

function updateCorrectAnswer(value: ChoiceKey) {
  emit('update', { ...local.value, correctAnswer: value })
}
</script>

<template>
  <div class="edit-section">
    <h2 class="edit-heading">
      問題文<span class="required-badge" aria-hidden="true">*</span>
    </h2>
    <label>
      <span class="visually-hidden">問題文</span>
      <textarea
        :value="form.questionText"
        :maxlength="QUESTION_TEXT_MAX"
        rows="3"
        :disabled="disabled"
        :aria-invalid="showFieldErrors && fieldErrors.questionText !== ''"
        @input="updateText(($event.target as HTMLTextAreaElement).value)"
      />
      <p
        v-if="showFieldErrors && fieldErrors.questionText"
        class="field-note is-error"
        role="alert"
      >
        {{ fieldErrors.questionText }}
      </p>
    </label>
  </div>

  <fieldset class="choices-field">
    <legend class="edit-heading">
      選択肢<span class="required-badge" aria-hidden="true">*</span>
    </legend>
    <label
      v-for="key in CHOICE_KEYS"
      :key="key"
    >
      <span class="choice-key-label">{{ key }}</span>
      <input
        :value="form.choices[key]"
        type="text"
        :maxlength="CHOICE_TEXT_MAX"
        :name="`choice-${key}`"
        :disabled="disabled"
        :aria-invalid="showFieldErrors && fieldErrors.choices[key] !== ''"
        @input="updateChoice(key, ($event.target as HTMLInputElement).value)"
      >
      <p
        v-if="showFieldErrors && fieldErrors.choices[key]"
        class="field-note is-error"
        role="alert"
      >
        {{ fieldErrors.choices[key] }}
      </p>
    </label>
  </fieldset>

  <fieldset class="correct-answer-field">
    <legend class="edit-heading">
      正解<span class="required-badge" aria-hidden="true">*</span>
    </legend>
    <div
      class="radio-grid"
      role="radiogroup"
      aria-label="正解の選択肢"
    >
      <label
        v-for="key in CHOICE_KEYS"
        :key="key"
        class="radio-option"
      >
        <input
          type="radio"
          name="correctAnswer"
          :value="key"
          :checked="form.correctAnswer === key"
          :disabled="disabled"
          @change="updateCorrectAnswer(key)"
        >
        <span>{{ form.choices[key] || `（選択肢${key}）` }}</span>
      </label>
    </div>
    <p
      v-if="showFieldErrors && fieldErrors.correctAnswer"
      class="field-note is-error"
      role="alert"
    >
      {{ fieldErrors.correctAnswer }}
    </p>
  </fieldset>
</template>
