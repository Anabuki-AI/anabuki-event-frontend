<script setup lang="ts">
import { useSeoMeta } from '#imports'
import { CANEL_FALLBACK_ROUTE, CHOICE_KEYS, QUESTION_TEXT_MAX } from '~/features/questions/definitions'
import {
  setupQuestionEdit,
  setupQuestionBack,
} from '~/features/questions/components/QuestionEditForm'

useSeoMeta({
  title: '問題編集',
  description: 'Anabuki Eventの問題編集画面です。',
})

const {
  form,
  fieldErrors,
  showFieldErrors,
  isSubmitting,
  isSubmitEnabled,
  submitErrorMessage,
  savedMessage,
  handleSubmit,
  handleCancel,
} = setupQuestionEdit()

// 「戻る」リンクとキャンセルで同じ「一つ前の画面へ戻る」挙動を使う
const { handleBack } = setupQuestionBack(() => {
  handleCancel()
  return true
})
</script>

<template>
  <section class="form-card quiz-page">
    <header class="question-header">
      <p class="quiz-header-title">クイズ大会</p>
      <p class="eyebrow">
        Edit question
      </p>
      <NuxtLink
        class="back-link"
        :to="CANEL_FALLBACK_ROUTE"
        @click.prevent="handleBack"
      >
        ← 例）問題一覧へ戻る
      </NuxtLink>
      <NuxtLink
        class="question-add-button"
        to="/event_operator/questione"
        target="_blank"
        rel="noopener"
      >
        編集する
      </NuxtLink>
    </header>

    <main class="page-shell">
      <h1>問題編集</h1>
      <p class="muted-copy">
        問題の内容を修正して保存してください。バックエンド未実装のため、内容は保存されません。
      </p>
      <form
        class="user-form question-edit-form"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <!-- 問題文 -->
        <div class="edit-section">
          <h2 class="edit-heading">問題文<span class="required-badge">*</span></h2>
          <label>
            <span class="visually-hidden">問題文</span>
            <textarea
              v-model.trim="form.questionText"
              :maxlength="QUESTION_TEXT_MAX"
              rows="3"
              :aria-invalid="showFieldErrors && fieldErrors.questionText !== ''"
              aria-describedby="question-text-note"
            />
            <p
              v-if="showFieldErrors && fieldErrors.questionText"
              id="question-text-note"
              class="field-note is-error"
              role="alert"
            >
              {{ fieldErrors.questionText }}
            </p>
          </label>
        </div>

        <!-- 選択肢 -->
        <fieldset class="choices-field">
          <legend class="edit-heading">選択肢<span class="required-badge">*</span></legend>
          <label
            v-for="key in CHOICE_KEYS"
            :key="key"
          >
            <span>{{ key }}</span>
            <input
              v-model.trim="form.choices[key]"
              type="text"
              :name="`choice-${key}`"
              :aria-invalid="showFieldErrors && fieldErrors.choices[key] !== ''"
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

        <!-- 正解 -->
        <fieldset class="correct-answer-field">
          <legend class="edit-heading">正解<span class="required-badge">*</span></legend>
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
                v-model="form.correctAnswer"
                type="radio"
                name="correctAnswer"
                :value="key"
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

        <!-- 保存 / キャンセル -->
        <div class="form-actions">
          <button
            type="button"
            class="button-cancel"
            :disabled="isSubmitting"
            @click="handleCancel"
          >
            キャンセル
          </button>
          <button
            type="submit"
            class="submit-button"
            :class="{ 'is-submitting': isSubmitting }"
            :disabled="!isSubmitEnabled"
          >
            {{ isSubmitting ? '保存中…' : '保存する' }}
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
          v-if="submitErrorMessage"
          class="status-message error"
          role="alert"
        >
          {{ submitErrorMessage }}
        </p>
      </form>
    </main>
  </section>
</template>
