<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchQuestion } from '~/features/problems/api/client'
import type { Question } from '~/features/problems/types'
import MultiplierForm from '~/features/problems/components/MultiplierForm.vue'
import { toApiError } from '~/lib/api/error'

useSeoMeta({
  title: '自信度倍率変更',
  description: '問題ごとの自信度倍率を変更する画面です。',
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
    <section class="admin-card form-card">
      <NuxtLink
        class="back-link"
        to="/event_operator/problem-management"
      >
        ← 問題一覧へ戻る
      </NuxtLink>
      <header class="problems-header">
        <div>
          <p class="eyebrow">
            Confidence multiplier
          </p>
          <h1>自信度倍率変更</h1>
          <p class="muted-copy">
            問題ごとの自信度倍率を変更します。倍率は正解時の配点に反映されます。
          </p>
        </div>
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
      <MultiplierForm
        v-else-if="question"
        :question="question"
      />
    </section>
  </main>
</template>
