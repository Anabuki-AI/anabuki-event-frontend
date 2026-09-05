<script setup lang="ts">
import QuestionForm from '~/features/problems/components/QuestionForm.vue'

useSeoMeta({
  title: '問題追加',
  description: '新しい問題を登録する画面です。',
})
</script>

<template>
  <main class="page-shell">
    <section class="admin-card form-card quiz-page">
      <NuxtLink
        class="back-link"
        to="/admin/problems"
      >
        ← 問題一覧へ戻る
      </NuxtLink>
      <header class="question-header">
        <p class="eyebrow">
          New question
        </p>
        <h1>問題追加</h1>
        <p class="muted-copy">
          新しい問題を登録します。問題文・選択肢・正解を入力して保存してください。
        </p>
      </header>
      <QuestionForm @saved="() => {}" />
    </section>
  </main>
</template>
