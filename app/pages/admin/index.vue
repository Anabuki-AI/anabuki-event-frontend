<script setup lang="ts">
import type { AdminEmailEntry, AdminSession } from '~/features/admin-auth/types/admin'
import { request } from '~/lib/api/client'
import { ApiError } from '~/lib/api/error'

const session = ref<AdminSession | null>(null)
const entries = ref<AdminEmailEntry[]>([])
const email = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function loadAdminPage() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    session.value = await request<AdminSession>('/admin/auth/session')
    entries.value = await request<AdminEmailEntry[]>('/admin/allowed-emails')
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      await navigateTo('/admin/login')
      return
    }
    errorMessage.value = '管理者情報を読み込めませんでした。'
  }
  finally {
    isLoading.value = false
  }
}

async function addEmail() {
  if (!email.value.trim()) return
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const created = await request<AdminEmailEntry>('/admin/allowed-emails', {
      method: 'POST',
      body: { email: email.value },
    })
    entries.value = [...entries.value.filter(entry => entry.id !== created.id), created].sort((a, b) => a.email.localeCompare(b.email))
    email.value = ''
    successMessage.value = '許可メールを追加しました。'
  }
  catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '許可メールを追加できませんでした。'
  }
  finally {
    isSaving.value = false
  }
}

async function deactivate(entry: AdminEmailEntry) {
  if (entry.id === null || !window.confirm(`${entry.email} を無効化しますか？`)) return
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await request(`/admin/allowed-emails/${entry.id}`, { method: 'DELETE' })
    entry.active = false
    successMessage.value = '管理者を無効化しました。対象セッションも失効しています。'
  }
  catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '管理者を無効化できませんでした。'
  }
}

async function logout() {
  await request('/admin/auth/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}

onMounted(loadAdminPage)
</script>

<template>
  <main class="admin-page">
    <header class="admin-page__header">
      <div>
        <p class="eyebrow">Administrator console</p>
        <h1>管理者設定</h1>
        <p v-if="session" class="muted-copy">{{ session.email }} でログイン中</p>
      </div>
      <button class="secondary-button" type="button" @click="logout">ログアウト</button>
    </header>

    <p v-if="errorMessage" class="status-message error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="status-message success" role="status">{{ successMessage }}</p>

    <section class="admin-panel" aria-labelledby="allowlist-title">
      <div class="admin-panel__heading">
        <div>
          <p class="eyebrow">Access control</p>
          <h2 id="allowlist-title">許可メールアドレス</h2>
        </div>
        <span class="admin-panel__hint">環境変数とDB登録の和集合</span>
      </div>

      <form class="admin-add-form" @submit.prevent="addEmail">
        <label for="admin-email">個別メールを追加</label>
        <div class="admin-add-form__row">
          <input id="admin-email" v-model="email" type="email" autocomplete="off" placeholder="admin@example.com" :disabled="isSaving">
          <button class="primary-link admin-add-form__button" type="submit" :disabled="isSaving || !email.trim()">追加</button>
        </div>
        <small>Google Workspaceドメイン全体ではなく、個別メールアドレスだけを登録できます。</small>
      </form>

      <p v-if="isLoading" class="muted-copy">読み込み中です…</p>
      <ul v-else class="admin-email-list">
        <li v-for="entry in entries" :key="`${entry.source}-${entry.id ?? entry.email}`" class="admin-email-list__item" :class="{ 'is-inactive': !entry.active }">
          <div>
            <strong>{{ entry.email }}</strong>
            <small>{{ entry.source === 'ENVIRONMENT' ? '環境変数' : '管理者UI / DB' }} · {{ entry.active ? '有効' : '無効' }}</small>
          </div>
          <button v-if="entry.source === 'DATABASE' && entry.active" class="danger-button" type="button" @click="deactivate(entry)">無効化</button>
          <span v-else-if="entry.source === 'ENVIRONMENT'" class="admin-email-list__protected">環境変数で管理</span>
        </li>
        <li v-if="entries.length === 0" class="muted-copy">許可メールはまだ登録されていません。</li>
      </ul>
    </section>
  </main>
</template>
