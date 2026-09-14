<script setup lang="ts">
import { reactive, ref } from 'vue'
import { createUser } from '../api/create-user'
import { toApiError } from '~/lib/api/error'

const form = reactive({
  userName: '',
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const user = await createUser({ ...form })
    form.password = ''
    await navigateTo({ path: '/users/waiting', query: { userName: user.userName } })
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
  <form class="user-form" @submit.prevent="handleSubmit">
    <label>
      <span>ユーザー名</span>
      <input
        v-model.trim="form.userName"
        name="userName"
        autocomplete="username"
        required
      >
    </label>

    <label>
      <span>メールアドレス</span>
      <input
        v-model.trim="form.email"
        name="email"
        type="email"
        autocomplete="email"
        required
      >
    </label>

    <label>
      <span>パスワード</span>
      <input
        v-model="form.password"
        name="password"
        type="password"
        autocomplete="new-password"
        required
      >
    </label>

    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? '登録中…' : '登録する' }}
    </button>

    <p v-if="errorMessage" class="status-message error" role="alert">
      {{ errorMessage }}
    </p>
  </form>
</template>
