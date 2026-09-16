<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, useId } from 'vue'
import { createQuestion } from '~/features/problems/api/client'
import type { QuestionPayload } from '~/features/problems/api/client'
import { problemErrorMessage } from '~/features/problems/validation'
import { toApiError } from '~/lib/api/error'
import '~/assets/css/question-add.css'

const emit = defineEmits<{
  close: []
  saved: []
}>()

type ChoiceLabel = 'A' | 'B' | 'C' | 'D'

const form = reactive({
  questionText: '',
  choiceA: '',
  choiceB: '',
  choiceC: '',
  choiceD: '',
})
const correctChoice = ref<ChoiceLabel | null>(null)
const isSaving = ref(false)
const submitErrorMessage = ref('')
const panel = ref<HTMLElement | null>(null)
const titleId = useId()

const canSave = computed<boolean>(
  () =>
    !isSaving.value
    && form.questionText.trim().length > 0
    && form.choiceA.trim().length > 0
    && form.choiceB.trim().length > 0
    && form.choiceC.trim().length > 0
    && form.choiceD.trim().length > 0
    && correctChoice.value !== null,
)

function handleQuestionInput(value: string) {
  form.questionText = value
}

function handleChoiceInput(choice: ChoiceLabel, value: string) {
  if (choice === 'A') form.choiceA = value
  else if (choice === 'B') form.choiceB = value
  else if (choice === 'C') form.choiceC = value
  else form.choiceD = value
}

function handleCorrectChoiceSelect(choice: ChoiceLabel) {
  correctChoice.value = choice
}

async function save() {
  if (!canSave.value || correctChoice.value === null) return

  isSaving.value = true
  submitErrorMessage.value = ''
  const payload: QuestionPayload = {
    questionText: form.questionText.trim(),
    choiceA: form.choiceA.trim(),
    choiceB: form.choiceB.trim(),
    choiceC: form.choiceC.trim(),
    choiceD: form.choiceD.trim(),
    correctAnswer: correctChoice.value,
  }

  try {
    await createQuestion(payload)
    emit('saved')
  }
  catch (error) {
    const apiError = toApiError(error)
    submitErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    isSaving.value = false
  }
}

function handleCancel() {
  if (isSaving.value) return
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !isSaving.value) emit('close')
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  panel.value?.focus()
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="question-add-shell" @click.self="handleCancel">
    <section ref="panel" class="question-add-card" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
      <header class="question-add-header">
        <p class="eyebrow">
          Event operator
        </p>
        <h1 :id="titleId">問題追加</h1>
        <p class="muted-copy">
          クイズ大会で出題する問題文・4つの選択肢と正解を入力して登録します。
        </p>
      </header>

      <form class="question-add-form" @submit.prevent="save()">
        <label class="question-add-field">
          <span class="question-add-label">問題文</span>
          <textarea
            class="question-add-textarea"
            rows="4"
            maxlength="200"
            placeholder="例：日本の首都はどこでしょう？"
            :value="form.questionText"
            :disabled="isSaving"
            @input="handleQuestionInput(($event.target as HTMLTextAreaElement).value)"
          />
        </label>

        <fieldset class="question-add-field question-add-choices">
          <legend class="question-add-label">選択肢（正解にチェックを付けてください）</legend>

          <div
            v-for="choice in [
              { label: 'A', text: form.choiceA },
              { label: 'B', text: form.choiceB },
              { label: 'C', text: form.choiceC },
              { label: 'D', text: form.choiceD },
            ] as const"
            :key="choice.label"
            class="question-add-choice-row"
          >
            <span class="question-add-choice-mark" aria-hidden="true">{{ choice.label }}</span>
            <input
              class="question-add-choice-input"
              type="text"
              maxlength="100"
              :placeholder="`選択肢${choice.label}を入力`"
              :value="choice.text"
              :disabled="isSaving"
              :aria-label="`選択肢${choice.label}`"
              @input="handleChoiceInput(choice.label, ($event.target as HTMLInputElement).value)"
            >
            <label class="question-add-correct">
              <input
                class="question-add-correct-radio"
                type="radio"
                name="question-add-correct"
                :value="choice.label"
                :checked="correctChoice === choice.label"
                :disabled="isSaving"
                :aria-label="`選択肢${choice.label}を正解にする`"
                @change="handleCorrectChoiceSelect(choice.label)"
              >
              <span
                class="question-add-correct-text"
                :class="{ 'is-selected': correctChoice === choice.label }"
              >正解</span>
            </label>
          </div>
          <p class="question-add-hint">
            正解はA〜Dのいずれか1つを選択してください。
          </p>
        </fieldset>

        <p v-if="submitErrorMessage" class="status-message error" role="alert">
          {{ submitErrorMessage }}
        </p>

        <div class="question-add-actions">
          <button
            type="button"
            class="question-add-cancel"
            :disabled="isSaving"
            @click="handleCancel()"
          >
            キャンセル
          </button>
          <button
            type="button"
            class="question-add-save"
            :disabled="!canSave"
            @click="save()"
          >
            {{ isSaving ? '保存中…' : '保存する' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
