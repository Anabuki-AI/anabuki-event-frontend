<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, useId } from 'vue'
import { resolveQuestionImageUrl, updateQuestion } from '~/features/problems/api/client'
import type { QuestionPayload } from '~/features/problems/api/client'
import type { Question } from '~/features/problems/types'
import { formatQuestionPosition } from '~/features/problems/components/QuestionRow'
import { QUESTION_POINTS_MAX, QUESTION_POINTS_MIN } from '~/features/problems/constants'
import { problemErrorMessage, validateImageFile, validatePointsInput } from '~/features/problems/validation'
import { toApiError } from '~/lib/api/error'
import '~/assets/css/questionedit2.css'

const props = defineProps<{ question: Question }>()
const emit = defineEmits<{
  close: []
  saved: []
}>()

type ChoiceLabel = 'A' | 'B' | 'C' | 'D'

const form = reactive({
  questionText: props.question.questionText,
  points: String(props.question.points),
  choiceA: props.question.choiceA,
  choiceB: props.question.choiceB,
  choiceC: props.question.choiceC,
  choiceD: props.question.choiceD,
  explanation: props.question.explanation ?? '',
  targetAudience: props.question.targetAudience ?? '',
})
const correctChoice = ref<ChoiceLabel>(props.question.correctAnswer)
const isSaving = ref(false)
const submitErrorMessage = ref('')
const panel = ref<HTMLElement | null>(null)
const titleId = useId()

const existingImageUrl = resolveQuestionImageUrl(props.question.imageUrl)
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const removeImage = ref(false)
const imageErrorMessage = ref('')

const displayedImageUrl = computed<string | null>(() => {
  if (imagePreviewUrl.value) return imagePreviewUrl.value
  return removeImage.value ? null : existingImageUrl
})

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (!file) return

  const error = validateImageFile(file)
  if (error) {
    imageErrorMessage.value = error
    input.value = ''
    return
  }

  imageErrorMessage.value = ''
  removeImage.value = false
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
  input.value = ''
}

function handleImageClear() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFile.value = null
  imagePreviewUrl.value = null
  imageErrorMessage.value = ''
}

function handleRemoveExistingImage() {
  handleImageClear()
  removeImage.value = true
}

function handleRestoreExistingImage() {
  removeImage.value = false
}

const canSave = computed<boolean>(
  () =>
    !isSaving.value
    && form.questionText.trim().length > 0
    && form.choiceA.trim().length > 0
    && form.choiceB.trim().length > 0
    && form.choiceC.trim().length > 0
    && form.choiceD.trim().length > 0
    && validatePointsInput(form.points, QUESTION_POINTS_MIN, QUESTION_POINTS_MAX) === '',
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
  if (!canSave.value) return

  isSaving.value = true
  submitErrorMessage.value = ''
  const payload: QuestionPayload = {
    questionText: form.questionText.trim(),
    choiceA: form.choiceA.trim(),
    choiceB: form.choiceB.trim(),
    choiceC: form.choiceC.trim(),
    choiceD: form.choiceD.trim(),
    correctAnswer: correctChoice.value,
    explanation: form.explanation.trim(),
    targetAudience: form.targetAudience.trim(),
    points: Number(form.points),
    image: imageFile.value,
    removeImage: removeImage.value,
  }

  try {
    await updateQuestion(props.question.id, payload)
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
onUnmounted(() => {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
})
</script>

<template>
  <div class="question-add-shell" @click.self="handleCancel">
    <section ref="panel" class="question-add-card" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
      <header class="question-add-header">
        <h1 :id="titleId">問題編集</h1>
        <h2>{{ formatQuestionPosition(question.position) }}</h2>
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

        <label class="question-add-field">
          <span class="question-add-label">配点</span>
          <input
            class="question-add-choice-input question-add-points-input"
            type="number"
            inputmode="numeric"
            :min="QUESTION_POINTS_MIN"
            :max="QUESTION_POINTS_MAX"
            step="1"
            :value="form.points"
            :disabled="isSaving"
            @input="form.points = ($event.target as HTMLInputElement).value"
          >
          <p class="question-add-hint">
            {{ QUESTION_POINTS_MIN }}〜{{ QUESTION_POINTS_MAX }}の整数で入力してください。
          </p>
        </label>

        <label class="question-add-field">
          <span class="question-add-label">問題画像（任意・出題画面に表示されます）</span>
          <input
            class="question-add-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            :disabled="isSaving"
            @change="handleImageChange"
          >
          <p v-if="imageErrorMessage" class="status-message error" role="alert">
            {{ imageErrorMessage }}
          </p>
          <div v-if="displayedImageUrl" class="question-add-image-preview">
            <img :src="displayedImageUrl" alt="問題画像のプレビュー">
            <button
              v-if="imageFile"
              type="button"
              class="question-add-image-remove"
              :disabled="isSaving"
              @click="handleImageClear"
            >
              選択を取り消す
            </button>
            <button
              v-else
              type="button"
              class="question-add-image-remove"
              :disabled="isSaving"
              @click="handleRemoveExistingImage"
            >
              画像を削除
            </button>
          </div>
          <p v-else-if="removeImage" class="question-add-hint">
            画像を削除します。
            <button type="button" class="question-add-image-restore" :disabled="isSaving" @click="handleRestoreExistingImage">
              元に戻す
            </button>
          </p>
        </label>

        <label class="question-add-field">
          <span class="question-add-label">出題対象（任意・出題画面に表示されます）</span>
          <input
            class="question-add-choice-input"
            type="text"
            maxlength="100"
            placeholder="例：AIテクノロジー学科1年"
            :value="form.targetAudience"
            :disabled="isSaving"
            @input="form.targetAudience = ($event.target as HTMLInputElement).value"
          >
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

        <label class="question-add-field">
          <span class="question-add-label">解説（任意・正解表示後に表示されます）</span>
          <textarea
            class="question-add-textarea"
            rows="3"
            maxlength="500"
            placeholder="正解とあわせて表示する簡単な解説を入力できます"
            :value="form.explanation"
            :disabled="isSaving"
            @input="form.explanation = ($event.target as HTMLTextAreaElement).value"
          />
        </label>

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
