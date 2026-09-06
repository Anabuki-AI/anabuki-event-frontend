<script setup lang="ts">
import { useRoute } from '#imports'
import RegistrationForm from '~/pages/RegistrationForm.vue'
import NicknameEditForm from '~/pages/NicknameEditForm.vue'

useSeoMeta({
  title: 'ユーザー登録',
  description: 'Anabuki Eventのユーザー登録ページです。',
})

const route = useRoute()

// 編集モードの判定。暫定はクエリ(mode=edit)で、本番はバックエンドの
// 「初回登録か否か」の判断に置き換える予定
const isEditMode = computed(() => route.query.mode === 'edit')
</script>

<template>
  <section class="form-card quiz-page">
    <header class="quiz-header">
      <p class="quiz-header-title">クイズ大会</p>
      <p v-if="isEditMode" class="eyebrow">
        Change name
      </p>
      <p v-else class="eyebrow">
        Create account
      </p>
    </header>
    <main class="page-shell">
      <NicknameEditForm v-if="isEditMode" />
      <RegistrationForm v-else />
    </main>
  </section>
</template>
