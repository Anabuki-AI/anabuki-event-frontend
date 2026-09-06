<script setup lang="ts">
import { USERNAME_MAX } from '~/features/registration/definitions'
import { setupNicknameEdit } from '~/features/registration/components/NicknameEditForm'

const {
  form,
  userNameStatus,
  userNameMessage,
  isSubmitEnabled,
  isSubmitting,
  submitErrorMessage,
  handleSubmit,
} = setupNicknameEdit()

const userNameInputClass = () => ({
  'is-available': userNameStatus.value === 'available',
  'is-invalid': userNameStatus.value === 'invalid' || userNameStatus.value === 'unavailable',
})
</script>

<template>
  <form
    class="user-form registration-form"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <!-- ニックネーム(登録済みの名前を初期表示し、書き換えて変更する) -->
    <label>
      <span>ニックネーム<span class="required-badge">*</span></span>
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

    <button
      type="submit"
      class="submit-button"
      :class="{ 'is-submitting': isSubmitting }"
      :disabled="!isSubmitEnabled"
    >
      {{ isSubmitting ? '変更中…' : '変更する' }}
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
