<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchQuestion } from '~/features/problems/api/client'
import type { Question } from '~/features/problems/types'
import QuestionForm from '~/features/problems/components/QuestionForm.vue'
import { parseQuestionId, problemErrorMessage } from '~/features/problems/validation'
import { toApiError } from '~/lib/api/error'

definePageMeta({ middleware: 'admin' })
useSeoMeta({
  title: '問題編集',
  description: '登録済みの問題の内容を編集する画面です。',
})

const route = useRoute()
const questionId = computed(() => parseQuestionId(route.params.id))
const question = ref<Question | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
let requestSequence = 0

async function loadQuestion() {
  const id = questionId.value
  const sequence = ++requestSequence
  question.value = null

  if (id == null) {
    isLoading.value = false
    errorMessage.value = '問題番号が正しくありません。問題一覧から選び直してください。'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const loadedQuestion = await fetchQuestion(id)
    if (sequence === requestSequence) question.value = loadedQuestion
  }
  catch (error) {
    if (sequence === requestSequence) {
      const apiError = toApiError(error)
      errorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
    }
  }
  finally {
    if (sequence === requestSequence) isLoading.value = false
  }
}

watch(questionId, () => void loadQuestion(), { immediate: true })
</script>

<template>
  <main class="page-shell">
    <section class="admin-card form-card">
      <NuxtLink class="back-link" to="/admin/problems">← 問題一覧へ戻る</NuxtLink>
      <header class="problems-header">
        <div>
          <p class="eyebrow">Edit question</p>
          <h1>問題編集</h1>
          <p class="muted-copy">問題の内容を修正して保存してください。</p>
        </div>
      </header>

      <p v-if="isLoading" class="status-message" role="status">問題を読み込み中…</p>
      <div v-else-if="errorMessage">
        <p class="status-message error" role="alert">{{ errorMessage }}</p>
        <button v-if="questionId != null" type="button" class="retry-button" @click="loadQuestion">再読み込み</button>
      </div>
      <QuestionForm v-else-if="question" :question="question" />
    </section>
  </main>
</template>
