<script setup lang="ts">
import { ref } from 'vue'
import { useQuestionAdd } from '~/features/question-add/use-question-add'
import '~/assets/css/question-add.css'

useSeoMeta({
  title: '問題追加画面',
  description: 'クイズ大会の問題を新しく登録します。',
})

const {
  questionText,
  previewUrl,
  fileName,
  choiceA,
  choiceB,
  choiceC,
  choiceD,
  correctChoice,
  isSaving,
  savedMessage,
  canSave,
  hasImage,
  handleQuestionInput,
  handleChoiceInput,
  handleCorrectChoiceSelect,
  handleImageSelect,
  clearImage,
  save,
  cancel,
} = useQuestionAdd()

// ネイティブfile inputのDOM値をクリアするための参照
// （クリアしないと、キャンセル後に同じファイルを再選択してもchangeが発火しない）
const fileInput = ref<HTMLInputElement | null>(null)

function handleCancel() {
  cancel()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <main class="page-shell question-add-shell">
    <section class="question-add-card" aria-label="問題の新規登録">
      <header class="question-add-header">
        <p class="eyebrow">
          Event operator
        </p>
        <h1>問題追加画面</h1>
        <p class="muted-copy">
          クイズ大会で出題する問題文・添付画像・4つの選択肢と正解を入力して登録します。
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
            :value="questionText"
            :disabled="isSaving"
            @input="handleQuestionInput(($event.target as HTMLTextAreaElement).value)"
          />
        </label>

        <div class="question-add-field">
          <label class="question-add-label" for="question-add-image">添付画像（任意）</label>
          <input
            id="question-add-image"
            ref="fileInput"
            class="question-add-file-input"
            type="file"
            accept="image/*"
            :disabled="isSaving"
            @change="handleImageSelect((($event.target as HTMLInputElement).files?.[0]) ?? null)"
          >
          <p class="question-add-hint">
            画像ファイル（JPEG・PNGなど）のみ選択できます。
          </p>

          <div v-if="hasImage" class="question-add-preview">
            <img
              v-if="previewUrl"
              class="question-add-preview-image"
              :src="previewUrl"
              :alt="`選択した画像のプレビュー：${fileName ?? ''}`"
            >
            <p v-if="fileName" class="question-add-file-name">
              {{ fileName }}
            </p>
            <button
              type="button"
              class="question-add-clear"
              :disabled="isSaving"
              @click="clearImage()"
            >
              画像の選択を解除
            </button>
          </div>
        </div>

        <fieldset class="question-add-field question-add-choices">
          <legend class="question-add-label">選択肢（正解にチェックを付けてください）</legend>

          <div
            v-for="choice in [
              { label: 'A', text: choiceA },
              { label: 'B', text: choiceB },
              { label: 'C', text: choiceC },
              { label: 'D', text: choiceD },
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

        <div class="question-add-actions">
          <button
            type="button"
            class="question-add-save"
            :disabled="!canSave"
            @click="save()"
          >
            保存する
          </button>
          <button
            type="button"
            class="question-add-cancel"
            @click="handleCancel()"
          >
            キャンセル
          </button>
        </div>
      </form>
    </section>

    <p class="question-add-status" role="status" aria-live="polite">
      {{ savedMessage }}
    </p>
  </main>
</template>
