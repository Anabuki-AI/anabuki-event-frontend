<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchQuestion } from '~/features/problems/api/client'
import type { Question } from '~/features/problems/types'
import QuestionForm from '~/features/problems/components/QuestionForm.vue'
import { toApiError } from '~/lib/api/error'

useSeoMeta({
  title: '問題編集',
  description: '登録済みの問題の内容を編集する画面です。',
})

const route = useRoute()
const questionId = Number(route.params.id)

const question = ref<Question | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    question.value = await fetchQuestion(questionId)
  }
  catch (error) {
    errorMessage.value = toApiError(error).message
  }
  finally {
    isLoading.value = false
  }
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
          Edit question
        </p>
        <h1>問題編集</h1>
        <p class="muted-copy">
          問題の内容を修正して保存してください。
        </p>
      </header>

      <p
        v-if="isLoading"
        class="status-message"
        role="status"
      >
        読み込み中…
      </p>
      <p
        v-else-if="errorMessage"
        class="status-message error"
        role="alert"
      >
        {{ errorMessage }}
      </p>
      <QuestionForm
        v-else-if="question"
        :question="question"
      />
    </section>
  </main>
</template>
