<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { updateConfidenceMultiplier } from '../api/client'
import {
  CONFIDENCE_MULTIPLIER_MAX,
  CONFIDENCE_MULTIPLIER_MIN,
  CONFIDENCE_MULTIPLIER_STEP,
} from '../constants'
import { validateMultiplierInput } from '../validation'
import type { Question } from '../types'
import { toApiError } from '~/lib/api/error'

const props = defineProps<{
  question: Question
}>()

const emit = defineEmits<{
  saved: [question: Question]
}>()

const router = useRouter()

const multiplierInput = ref(props.question.confidenceMultiplier)
const errorMessage = ref('')
const isSubmitting = ref(false)
const savedMessage = ref('')

const baseline = props.question.confidenceMultiplier

const isSubmitEnabled = computed(() =>
  !isSubmitting.value
  && multiplierInput.value !== baseline
  && validateMultiplierInput(multiplierInput.value, CONFIDENCE_MULTIPLIER_MIN, CONFIDENCE_MULTIPLIER_MAX) === '',
)

async function handleSubmit() {
  savedMessage.value = ''
  errorMessage.value = ''

  const validationError = validateMultiplierInput(multiplierInput.value, CONFIDENCE_MULTIPLIER_MIN, CONFIDENCE_MULTIPLIER_MAX)
  if (validationError !== '') {
    errorMessage.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    const saved = await updateConfidenceMultiplier(props.question.id, multiplierInput.value)
    savedMessage.value = `Q${saved.id} の自信度倍率を ×${saved.confidenceMultiplier} に変更しました。`
    emit('saved', saved)
  }
  catch (error) {
    errorMessage.value = toApiError(error).message
  }
  finally {
    isSubmitting.value = false
  }
}

/** キャンセルは履歴に依存せず一覧へ戻す（miro仕様: 問題一覧 ← 自信度倍率変更） */
function handleCancel() {
  void router.push('/event_operator/problem-management')
}
</script>

<template>
  <form
    class="user-form multiplier-form"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <dl class="multiplier-summary">
      <div class="multiplier-summary-row">
        <dt>問題</dt>
        <dd>{{ question.questionText }}</dd>
      </div>
      <div class="multiplier-summary-row">
        <dt>現在の倍率</dt>
        <dd>×{{ baseline }}</dd>
      </div>
    </dl>

    <label class="multiplier-input-label">
      <span>新しい自信度倍率</span>
      <div class="multiplier-input-row">
        <span
          class="multiplier-prefix"
          aria-hidden="true"
        >×</span>
        <input
          v-model="multiplierInput"
          type="number"
          inputmode="decimal"
          :min="CONFIDENCE_MULTIPLIER_MIN"
          :max="CONFIDENCE_MULTIPLIER_MAX"
          :step="CONFIDENCE_MULTIPLIER_STEP"
          :disabled="isSubmitting"
          name="confidenceMultiplier"
        >
      </div>
      <span class="field-note">
        0〜{{ CONFIDENCE_MULTIPLIER_MAX }}・小数第2位まで。1.00で等倍、大きいほど正解時の配点が増えます。
      </span>
    </label>

    <div class="form-actions">
      <button
        type="submit"
        class="submit-button"
        :class="{ 'is-submitting': isSubmitting }"
        :disabled="!isSubmitEnabled"
      >
        {{ isSubmitting ? '保存中…' : '変更を保存' }}
      </button>
      <button
        type="button"
        class="button-cancel"
        :disabled="isSubmitting"
        @click="handleCancel"
      >
        キャンセル
      </button>
    </div>

    <p
      v-if="savedMessage"
      class="status-message success"
      role="status"
    >
      {{ savedMessage }}
    </p>
    <p
      v-if="errorMessage"
      class="status-message error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </form>
</template>
