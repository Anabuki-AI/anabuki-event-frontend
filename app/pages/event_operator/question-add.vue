<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, useId } from 'vue'
import { createQuestion } from '~/features/problems/api/client'
import type { QuestionPayload } from '~/features/problems/api/client'
import { QUESTION_POINTS_DEFAULT, QUESTION_POINTS_MAX, QUESTION_POINTS_MIN, TIME_LIMIT_SECONDS_MAX } from '~/features/problems/constants'
import { parseTimeLimitInput, problemErrorMessage, validateImageFile, validatePointsInput, validateTimeLimitInput } from '~/features/problems/validation'
import { toApiError } from '~/lib/api/error'
import '~/assets/css/question-add.css'

const emit = defineEmits<{
  close: []
  saved: []
}>()

type ChoiceLabel = 'A' | 'B' | 'C' | 'D'

const form = reactive({
  questionText: '',
  points: String(QUESTION_POINTS_DEFAULT),
  choiceA: '',
  choiceB: '',
  choiceC: '',
  choiceD: '',
  explanation: '',
  targetAudience: '',
  /** 入力欄の生文字列。空欄なら制限時間なし。 */
  timeLimitSeconds: '',
})
const timeLimitErrorMessage = ref('')
const correctChoice = ref<ChoiceLabel | null>(null)
const isSaving = ref(false)
const submitErrorMessage = ref('')
const panel = ref<HTMLElement | null>(null)
const titleId = useId()

const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const imageErrorMessage = ref('')
const isImageDragOver = ref(false)
let imageDragDepth = 0

function applyImageFile(file: File) {
  const error = validateImageFile(file)
  if (error) {
    imageErrorMessage.value = error
    return
  }

  imageErrorMessage.value = ''
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (!file) return

  applyImageFile(file)
  input.value = ''
}

function handleImageClear() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imageFile.value = null
  imagePreviewUrl.value = null
  imageErrorMessage.value = ''
}

function handleImageDragEnter() {
  if (isSaving.value) return
  imageDragDepth += 1
  isImageDragOver.value = true
}

function handleImageDragLeave() {
  if (isSaving.value) return
  imageDragDepth = Math.max(0, imageDragDepth - 1)
  if (imageDragDepth === 0) isImageDragOver.value = false
}

function handleImageDrop(event: DragEvent) {
  imageDragDepth = 0
  isImageDragOver.value = false
  if (isSaving.value) return

  const file = event.dataTransfer?.files?.[0] ?? null
  if (!file) return
  applyImageFile(file)
}

const canSave = computed<boolean>(
  () =>
    !isSaving.value
    && form.questionText.trim().length > 0
    && form.choiceA.trim().length > 0
    && form.choiceB.trim().length > 0
    && form.choiceC.trim().length > 0
    && form.choiceD.trim().length > 0
    && correctChoice.value !== null
    && validateTimeLimitInput(form.timeLimitSeconds) === ''
    && validatePointsInput(form.points, QUESTION_POINTS_MIN, QUESTION_POINTS_MAX) === '',
)

function handleQuestionInput(value: string) {
  form.questionText = value
}

function handleTimeLimitInput(value: string) {
  form.timeLimitSeconds = value
  timeLimitErrorMessage.value = validateTimeLimitInput(value)
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
    explanation: form.explanation.trim(),
    targetAudience: form.targetAudience.trim(),
    points: Number(form.points),
    timeLimitSeconds: parseTimeLimitInput(form.timeLimitSeconds),
    image: imageFile.value,
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
onUnmounted(() => {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
})
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
            {{ QUESTION_POINTS_MIN }}〜{{ QUESTION_POINTS_MAX }}の整数で入力してください（初期値{{ QUESTION_POINTS_DEFAULT }}）。
          </p>
        </label>

        <label class="question-add-field">
          <span class="question-add-label">問題画像（任意・出題画面に表示されます）</span>
          <div
            class="question-add-dropzone"
            :class="{ 'is-dragover': isImageDragOver }"
            @dragenter.prevent="handleImageDragEnter"
            @dragover.prevent
            @dragleave.prevent="handleImageDragLeave"
            @drop.prevent="handleImageDrop"
          >
            <input
              class="question-add-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              :disabled="isSaving"
              @change="handleImageChange"
            >
            <div class="question-add-dropzone-content">
              <p class="question-add-dropzone-text">ここに画像をドラッグ&ドロップ</p>
              <p class="question-add-dropzone-hint">
                またはクリックして選択（PNG・JPEG・WEBP・GIF、5MB以下）
              </p>
            </div>
          </div>
          <p v-if="imageErrorMessage" class="status-message error" role="alert">
            {{ imageErrorMessage }}
          </p>
          <div v-if="imagePreviewUrl" class="question-add-image-preview">
            <img :src="imagePreviewUrl" alt="選択した画像のプレビュー">
            <button type="button" class="question-add-image-remove" :disabled="isSaving" @click="handleImageClear">
              画像を削除
            </button>
          </div>
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

        <label class="question-add-field">
          <span class="question-add-label">制限時間（秒・任意）</span>
          <input
            class="question-add-choice-input question-add-time-limit"
            type="number"
            min="1"
            :max="TIME_LIMIT_SECONDS_MAX"
            step="1"
            inputmode="numeric"
            placeholder="空欄で制限時間なし"
            :value="form.timeLimitSeconds"
            :disabled="isSaving"
            @input="handleTimeLimitInput(($event.target as HTMLInputElement).value)"
          >
          <p class="question-add-hint">
            出題管理画面のタイマーで使用します。空欄の場合は制限時間を設けません。
          </p>
          <p v-if="timeLimitErrorMessage" class="status-message error" role="alert">
            {{ timeLimitErrorMessage }}
          </p>
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
