<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createParticipant } from '../api/create-participant'
import { validateParticipantRegistration, type ParticipantRegistrationErrors } from '../validation'
import { toApiError } from '~/lib/api/error'

const form = reactive({
  displayName: '',
  gender: '',
  ageGroup: '',
  studentType: '',
  school: '',
  department: '',
  agreedTerms: false,
})

const validationErrors = ref<ParticipantRegistrationErrors>({})
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  validationErrors.value = validateParticipantRegistration(form)

  if (Object.keys(validationErrors.value).length > 0) {
    errorMessage.value = '入力内容を確認してください。'
    return
  }

  isSubmitting.value = true

  try {
    await createParticipant({ ...form })
    await navigateTo('/participants/waiting')
  }
  catch (error) {
    errorMessage.value = toApiError(error).message
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="participant-form" novalidate @submit.prevent="handleSubmit">
    <label>
      <span>表示名</span>
      <input
        v-model.trim="form.displayName"
        name="displayName"
        autocomplete="nickname"
        maxlength="100"
        :aria-describedby="validationErrors.displayName ? 'display-name-error' : undefined"
        :aria-invalid="Boolean(validationErrors.displayName)"
      >
      <span v-if="validationErrors.displayName" id="display-name-error" class="field-error">
        {{ validationErrors.displayName }}
      </span>
    </label>

    <label>
      <span>性別</span>
      <select v-model="form.gender" name="gender" :aria-invalid="Boolean(validationErrors.gender)">
        <option disabled value="">選択してください</option>
        <option value="male">男性</option>
        <option value="female">女性</option>
        <option value="no_answer">回答しない</option>
      </select>
      <span v-if="validationErrors.gender" class="field-error">{{ validationErrors.gender }}</span>
    </label>

    <label>
      <span>年齢層</span>
      <select v-model="form.ageGroup" name="ageGroup" :aria-invalid="Boolean(validationErrors.ageGroup)">
        <option disabled value="">選択してください</option>
        <option value="teens">10代</option>
        <option value="20s">20代</option>
        <option value="30s">30代</option>
        <option value="40s_or_over">40代以上</option>
        <option value="no_answer">回答しない</option>
      </select>
      <span v-if="validationErrors.ageGroup" class="field-error">{{ validationErrors.ageGroup }}</span>
    </label>

    <label>
      <span>学生区分</span>
      <select v-model="form.studentType" name="studentType" :aria-invalid="Boolean(validationErrors.studentType)">
        <option disabled value="">選択してください</option>
        <option value="student">学生</option>
        <option value="not_student">学生ではない</option>
      </select>
      <span v-if="validationErrors.studentType" class="field-error">{{ validationErrors.studentType }}</span>
    </label>

    <label>
      <span>学校名（任意）</span>
      <input v-model.trim="form.school" name="school" maxlength="255">
      <span v-if="validationErrors.school" class="field-error">{{ validationErrors.school }}</span>
    </label>

    <label>
      <span>学科・所属（任意）</span>
      <input v-model.trim="form.department" name="department" maxlength="255">
      <span v-if="validationErrors.department" class="field-error">{{ validationErrors.department }}</span>
    </label>

    <label class="terms-label">
      <input v-model="form.agreedTerms" name="agreedTerms" type="checkbox">
      <span>参加規約に同意します</span>
    </label>
    <span v-if="validationErrors.agreedTerms" class="field-error">{{ validationErrors.agreedTerms }}</span>

    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? '登録中…' : '参加登録する' }}
    </button>

    <p v-if="errorMessage" class="status-message error" role="alert">
      {{ errorMessage }}
    </p>
  </form>
</template>
