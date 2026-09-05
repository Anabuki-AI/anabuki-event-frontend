<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchQuestions } from '~/features/problems/api/client'
import type { Question } from '~/features/problems/types'
import QuestionRow from '~/features/problems/components/QuestionRow.vue'
import { toApiError } from '~/lib/api/error'

useSeoMeta({
  title: '問題管理画面',
  description: '登録されている問題の一覧を確認し、編集・追加・自信度倍率変更へ移動できます。',
})

const questions = ref<Question[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

async function loadQuestions() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    questions.value = await fetchQuestions()
  }
  catch (error) {
    errorMessage.value = toApiError(error).message
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadQuestions)
</script>

<template>
  <main class="page-shell">
    <section class="admin-card problems-card">
      <NuxtLink
        class="back-link"
        to="/admin"
      >
        ← 運営者メニューへ戻る
      </NuxtLink>

      <header class="problems-header">
        <div>
          <p class="eyebrow">
            Admin
          </p>
          <h1>問題管理画面</h1>
          <p class="muted-copy">
            登録済みの問題を確認し、各問題の編集・自信度倍率の変更や、新しい問題の追加ができます。
          </p>
        </div>
        <NuxtLink
          class="primary-link add-question-link"
          to="/admin/problems/new"
        >
          ＋ 問題を追加
        </NuxtLink>
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
        <button
          type="button"
          class="retry-button"
          @click="loadQuestions"
        >
          再読み込み
        </button>
      </p>

      <p
        v-else-if="questions.length === 0"
        class="status-message empty"
        role="status"
      >
        登録されている問題がありません。「＋ 問題を追加」から最初の問題を登録してください。
      </p>

      <div
        v-else
        class="question-list"
      >
        <p
          class="question-count"
          role="status"
        >
          全 {{ questions.length }} 問
        </p>
        <QuestionRow
          v-for="question in questions"
          :key="question.id"
          :question="question"
        />
      </div>
    </section>
  </main>
</template>
