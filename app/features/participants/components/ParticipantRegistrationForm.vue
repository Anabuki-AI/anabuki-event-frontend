<script setup lang="ts">
import { ref } from 'vue'
import {
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  TERMS_TEXT,
} from '../definitions'
import { setupParticipantRegistrationForm } from './ParticipantRegistrationForm'

const {
  form,
  showFieldErrors,
  fieldErrors,
  isSubmitEnabled,
  isSubmitting,
  submitErrorMessage,
  handleSubmit,
} = setupParticipantRegistrationForm()

// 利用規約ダイアログの開閉
const isTermsDialogOpen = ref(false)

function openTermsDialog() {
  isTermsDialogOpen.value = true
}

// ダイアログ内の「戻る」: 同意状態はそのままに登録画面へ戻る
function closeTermsDialog() {
  isTermsDialogOpen.value = false
}
</script>

<template>
  <form
    class="user-form registration-form"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <h1>参加登録</h1>

    <label>
      <span>表示名<span class="required-badge">*</span></span>
      <input
        v-model.trim="form.displayName"
        type="text"
        name="displayName"
        autocomplete="nickname"
        maxlength="100"
        :aria-invalid="Boolean(fieldErrors.displayName)"
        aria-describedby="display-name-note"
      >
      <p
        v-if="showFieldErrors && fieldErrors.displayName"
        id="display-name-note"
        class="field-note is-error"
        role="alert"
      >
        {{ fieldErrors.displayName }}
      </p>
    </label>

    <!-- アンケート -->
    <fieldset class="survey-field">
      <legend>アンケート<span class="required-badge">*必須</span></legend>

      <label>
        <span>性別<span class="required-badge">*</span></span>
        <select
          v-model="form.gender"
          class="select-input"
        >
          <option
            value=""
            disabled
          >
            選択してください
          </option>
          <option
            v-for="option in GENDER_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p
          v-if="showFieldErrors && fieldErrors.gender"
          class="field-note is-error"
          role="alert"
        >
          {{ fieldErrors.gender }}
        </p>
      </label>

      <label>
        <span>年代<span class="required-badge">*</span></span>
        <select
          v-model="form.ageGroup"
          class="select-input"
        >
          <option
            value=""
            disabled
          >
            選択してください
          </option>
          <option
            v-for="option in AGE_GROUP_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p
          v-if="showFieldErrors && fieldErrors.ageGroup"
          class="field-note is-error"
          role="alert"
        >
          {{ fieldErrors.ageGroup }}
        </p>
      </label>



      <!-- 学生種別が学生の場合のみ表示。穴吹カレッジ生=学校プルダウン/他校生=学校名入力 -->
      <label>
        <span>学校名</span>
        <input v-model.trim="form.school" type="text" name="school" autocomplete="organization" maxlength="255" placeholder="学校名を入力（任意）">
        <p v-if="showFieldErrors && fieldErrors.school" class="field-note is-error" role="alert">{{ fieldErrors.school }}</p>
      </label>


    </fieldset>

    <!-- 利用規約(アンケートの後に配置。入力→アンケート→同意→登録の流れ) -->
    <fieldset class="terms-field">
      <legend>利用規約<span class="required-badge">*</span></legend>
      <button
        type="button"
        class="terms-open-button"
        aria-haspopup="dialog"
        @click="openTermsDialog"
      >
        利用規約を確認する
      </button>
      <p
        v-if="showFieldErrors && fieldErrors.terms"
        class="field-note is-error"
        role="alert"
      >
        {{ fieldErrors.terms }}
      </p>
    </fieldset>

    <!-- 利用規約ダイアログ(規約を読みながらその場で同意をチェックできる。「戻る」で同意状態のまま登録画面へ) -->
    <div
      v-if="isTermsDialogOpen"
      class="terms-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="利用規約"
    >
      <div class="terms-dialog-panel">
        <h2 class="terms-dialog-title">利用規約</h2>
        <div
          class="terms-scroll"
          role="region"
          aria-label="利用規約 本文"
          tabindex="0"
        >
          <p class="terms-text">{{ TERMS_TEXT }}</p>
        </div>
        <label class="check-row">
          <input v-model="form.agreedTerms" type="checkbox" name="agreedTerms">
          <span>利用規約に同意します</span>
        </label>
        <button
          type="button"
          class="terms-dialog-back"
          @click="closeTermsDialog"
        >
          閉じる
        </button>
      </div>
    </div>

    <button
      type="submit"
      class="submit-button"
      :class="{ 'is-submitting': isSubmitting }"
      :disabled="!isSubmitEnabled"
    >
      {{ isSubmitting ? '登録中…' : '参加登録する' }}
    </button>

    <p
      v-if="submitErrorMessage"
      class="status-message error"
      role="alert"
    >
      {{ submitErrorMessage }}
    </p>
  </form>
</template>
