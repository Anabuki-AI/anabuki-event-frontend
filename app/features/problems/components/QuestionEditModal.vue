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
  saved: [question: Question]
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
  isRelayQuestion: props.question.isRelayQuestion ?? false,
})
const correctChoice = ref<ChoiceLabel>(props.question.correctAnswer)
const isSaving = ref(false)
// バックエンドの correct_answer_locked_for_unselected_relay_question バリデーション
// が返すエラーを、汎用メッセージではなくこの案内文で表示するために使う。
const RELAY_CORRECT_ANSWER_LOCKED_MESSAGE
  = 'この問題は中継問題として「今回の出題」に選択されていないため、正解を変更できません。「問題管理」の一覧で選択してから変更してください。'
// backend/app/models/question.rb の protect_live_question が返すエラー。
// 中継問題が「選択済み」かつ「出題・正解公開済み」であっても、ライブ進行画面で
// まだ「次の問題」に進んでいない間(quiz_sessions.current_question_id が
// このIDを指したまま)は correct_answer を含む LIVE_FIELDS の変更を拒否する。
// これは中継問題の選択ロックとは別の理由であり、上の案内文をそのまま出すと
// 「選択したのに保存できない」という誤解を招く(選択状態は無関係なため)。
const LIVE_QUESTION_CORRECT_ANSWER_LOCKED_MESSAGE
  = 'この問題は現在ライブ進行画面で出題中(または直前に出題済み)のため、正解を変更できません。「出題管理」で次の問題に進んでから変更してください。'
// fieldErrors.correctAnswer に入りうる、バックエンドの生バリデーションメッセージ
// (backend/app/models/question.rb) からユーザー向け文言へのマッピング。
// 両方とも同じ HTTP 422 + fieldErrors.correctAnswer で返ってくるため、
// メッセージ本文で原因を区別する必要がある。
const CORRECT_ANSWER_LOCK_MESSAGES: Record<string, string> = {
  'cannot be changed for a relay question that is not selected': RELAY_CORRECT_ANSWER_LOCKED_MESSAGE,
  'cannot be changed while this question is live': LIVE_QUESTION_CORRECT_ANSWER_LOCKED_MESSAGE,
}
// 正解ロックの理由。2つは完全に独立した状態(isSelectedRelayQuestion と
// isLiveQuestion)から生じるため、どちらか一方だけを見て判定すると
// 「選択済みなのにロックされて見える/選択されていないだけだと誤案内する」
// といった食い違いが起きる。'live' を 'unselected' より優先するのは、
// 選択状態に関わらずライブ中は保存できない(バックエンドの優先順位と一致)ため。
type CorrectAnswerLockReason = 'live' | 'unselected' | null
const correctAnswerLockReason = computed<CorrectAnswerLockReason>(() => {
  // ライブ進行画面で quiz_sessions.current_question として出題中(または
  // 正解公開直後でまだ次の問題に進んでいない)間は、選択状態やrevealedAtに
  // 関わらず常にロックする(backendのprotect_live_questionと同じ優先順位)。
  if (props.question.isLiveQuestion === true) return 'live'
  // 中継問題は、問題管理の一覧で「今回の出題」として選択されるまで正解を
  // 変更できない(バックエンドAPIも同じ制約を強制する)。通常の問題には影響
  // しない。ただし、一度ライブ進行で出題・正解公開済み(revealedAt設定済み)の
  // 中継問題は、その後の出題で別の中継問題が選択されて選択が外れても、
  // 正解を変更できる。
  if (
    props.question.isRelayQuestion === true
    && props.question.isSelectedRelayQuestion !== true
    && !props.question.revealedAt
  ) return 'unselected'
  return null
})
const isCorrectAnswerLocked = computed<boolean>(() => correctAnswerLockReason.value !== null)
const correctAnswerLockNote = computed<string>(() => {
  if (correctAnswerLockReason.value === 'live') return LIVE_QUESTION_CORRECT_ANSWER_LOCKED_MESSAGE
  if (correctAnswerLockReason.value === 'unselected') return RELAY_CORRECT_ANSWER_LOCKED_MESSAGE
  return ''
})
const submitErrorMessage = ref('')
const panel = ref<HTMLElement | null>(null)
const titleId = useId()

const existingImageUrl = resolveQuestionImageUrl(props.question.imageUrl)
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const removeImage = ref(false)
const imageErrorMessage = ref('')
const isImageDragOver = ref(false)
let imageDragDepth = 0

const displayedImageUrl = computed<string | null>(() => {
  if (imagePreviewUrl.value) return imagePreviewUrl.value
  return removeImage.value ? null : existingImageUrl
})

function applyImageFile(file: File) {
  const error = validateImageFile(file)
  if (error) {
    imageErrorMessage.value = error
    return
  }

  imageErrorMessage.value = ''
  removeImage.value = false
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
  if (isCorrectAnswerLocked.value) return
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
    isRelayQuestion: form.isRelayQuestion,
    image: imageFile.value,
    removeImage: removeImage.value,
  }

  try {
    const question = await updateQuestion(props.question.id, payload)
    emit('saved', question)
  }
  catch (error) {
    const apiError = toApiError(error)
    // 422 の汎用メッセージは、正解ロック違反という具体的な原因を隠してしまう
    // (問題テキスト長超過などの他の入力エラーと同じ「入力内容を確認してください」
    // になり、運営者にはなぜ保存できないか伝わらない)。fieldErrors.correctAnswer
    // がある場合は、原因(中継問題の選択ロック/ライブ出題中ロック)に応じた案内文を
    // 表示する。どちらでもない未知の correctAnswer エラーは汎用メッセージにフォールバックする。
    const correctAnswerError = apiError.fieldErrors?.correctAnswer
    const correctAnswerErrorMessage = Array.isArray(correctAnswerError) ? correctAnswerError[0] : correctAnswerError
    submitErrorMessage.value = correctAnswerErrorMessage
      ? (CORRECT_ANSWER_LOCK_MESSAGES[correctAnswerErrorMessage] ?? problemErrorMessage(apiError.statusCode, apiError.message))
      : problemErrorMessage(apiError.statusCode, apiError.message)
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
              accept="image/webp"
              :disabled="isSaving"
              @change="handleImageChange"
            >
            <div class="question-add-dropzone-content">
              <p class="question-add-dropzone-text">ここに画像をドラック＆ドロップまたはクリックして選択</p>
              <p class="question-add-dropzone-hint">
                対応形式：WEBP、最大サイズ：5MB
              </p>
            </div>
          </div>
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
          <p v-if="isCorrectAnswerLocked" class="question-add-hint question-add-relay-lock-note" role="status">
            {{ correctAnswerLockNote }}
          </p>

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
                :disabled="isSaving || isCorrectAnswerLocked"
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
          <label class="question-add-checkbox-field">
            <input v-model="form.isRelayQuestion" type="checkbox" :disabled="isSaving">
            <span>中継問題として扱う</span>
          </label>
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
