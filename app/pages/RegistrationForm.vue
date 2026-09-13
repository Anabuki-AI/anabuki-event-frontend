<script setup lang="ts">
import { ref } from 'vue'
import {
  AGE_GROUP_OPTIONS,
  DEPARTMENT_OPTIONS,
  GENDER_OPTIONS,
  SCHOOL_OPTIONS,
  STUDENT_TYPE_OPTIONS,
  TERMS_TEXT,
  USERNAME_MAX,
} from '~/features/registration/definitions'
import { setupRegistrationForm } from '~/features/registration/components/RegistrationForm'

const {
  form,
  otherSchoolName,
  userNameStatus,
  userNameMessage,
  isDepartmentRequired,
  isSchoolRequired,
  showFieldErrors,
  fieldErrors,
  isSubmitEnabled,
  isSubmitting,
  submitErrorMessage,
  handleSubmit,
} = setupRegistrationForm()

const userNameInputClass = () => ({
  'is-available': userNameStatus.value === 'available',
  'is-invalid': userNameStatus.value === 'invalid' || userNameStatus.value === 'unavailable',
})

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
    <!-- ページタイトル(new.vueのヘッダーから移動) -->
    <h1>ユーザー登録</h1>

    <!-- ユーザーネーム -->
    <label>
      <span>ユーザーネーム<span class="required-badge">*</span></span>
      <input
        v-model.trim="form.userName"
        :class="userNameInputClass()"
        type="text"
        name="userName"
        autocomplete="username"
        :maxlength="USERNAME_MAX"
        :aria-invalid="userNameStatus === 'invalid' || userNameStatus === 'unavailable'"
        aria-describedby="user-name-note"
      >
      <p
        id="user-name-note"
        class="field-note"
        :class="{
          'is-error': userNameStatus === 'invalid' || userNameStatus === 'unavailable',
          'is-success': userNameStatus === 'available',
        }"
        aria-live="polite"
      >
        {{ userNameMessage }}
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

      <label>
        <span>学生種別<span class="required-badge">*</span></span>
        <select
          v-model="form.studentType"
          class="select-input"
        >
          <option
            value=""
            disabled
          >
            選択してください
          </option>
          <option
            v-for="option in STUDENT_TYPE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p
          v-if="showFieldErrors && fieldErrors.studentType"
          class="field-note is-error"
          role="alert"
        >
          {{ fieldErrors.studentType }}
        </p>
      </label>

      <!-- 学生種別が学生の場合のみ表示。穴吹カレッジ生=学校プルダウン/他校生=学校名入力 -->
      <label
        v-if="isSchoolRequired"
      >
        <span>学校名<span class="required-badge">*</span></span>

        <!-- 額生活「その他の学校」以外はプルダウン-->
        <select
          v-if="isDepartmentRequired"
          v-model="form.school"
          class="select-input"
        >
          <option
            value=""
            disabled
          >
            選択してください
          </option>
          <option
            v-for="option in SCHOOL_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <!-- 他校の学生 または 「その他の学校」選択時は手入力（otherSchoolName にバインド）-->
        <input
          v-else
          v-model.trim="otherSchoolName"
          type="text"
          name="school"
          autocomplete="organization"
          placeholder="学校名を入力してください"
        >
        <p
          v-if="showFieldErrors && fieldErrors.school"
          class="field-note is-error"
          role="alert"
        >
          {{ fieldErrors.school }}
        </p>
      </label>

      <label
        v-if="isDepartmentRequired"
      >
        <span>学科<span class="required-badge">*</span></span>
        <select
          v-model="form.department"
          class="select-input"
        >
          <option
            value=""
            disabled
          >
            選択してください
          </option>
          <option
            v-for="option in DEPARTMENT_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p
          v-if="showFieldErrors && fieldErrors.department"
          class="field-note is-error"
          role="alert"
        >
          {{ fieldErrors.department }}
        </p>
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
      {{ isSubmitting ? '登録中…' : '登録する' }}
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
