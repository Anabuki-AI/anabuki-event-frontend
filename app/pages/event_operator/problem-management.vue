<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchQuestions } from '~/features/problems/api/client'
import { CHOICE_KEYS } from '~/features/problems/constants'
import type { Question } from '~/features/problems/types'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import {
  correctChoiceText,
  formatCorrectBadge,
  formatMultiplierChip,
  formatQuestionId,
} from '~/features/problems/components/QuestionRow'
import { toApiError } from '~/lib/api/error'

useSeoMeta({
  title: '問題管理画面',
  description: '登録されている問題の一覧を確認し、編集・追加へ移動できます。',
})

const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()

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
    <!-- 常設サイドバー。各管理画面共通のナビ。ボタンを押すとメニュー部分を完全に隠す -->
    <aside
      class="admin-sidebar"
      :class="{ 'admin-sidebar--collapsed': !isSidebarExpanded }"
      aria-label="管理機能メニュー"
      @keydown="handleSidebarKeydown"
    >
      <div class="admin-sidebar-head">
        <button
          type="button"
          class="admin-sidebar-toggle"
          :aria-label="isSidebarExpanded ? 'メニューを隠す' : 'メニューを表示する'"
          :aria-expanded="isSidebarExpanded"
          @click="toggleSidebar"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <p v-if="isSidebarExpanded" class="admin-sidebar-title">メニュー</p>
      </div>
      <nav v-if="isSidebarExpanded" class="admin-sidebar-nav">
        <NuxtLink class="admin-sidebar-link" to="/event_operator">運営者メイン</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/voting-rate">投票率ページ</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/admin/quiz-control">出題管理</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/problem-management">問題管理</NuxtLink>
      </nav>
    </aside>

    <section class="admin-card problems-card">
      <header class="problems-header">
        <div>
          <p class="eyebrow">
            Admin
          </p>
          <h1>問題管理</h1>
          <p class="muted-copy">
            登録済みの問題を確認し、各問題の編集や、新しい問題の追加ができます。
          </p>
        </div>
        <NuxtLink
          class="primary-link add-question-link"
          to="/admin/problems/new"
        >
          ＋ 問題を追加
        </NuxtLink>
      </header>

      <p class="mock-notice">
        現在は仮のデータを表示しています。実API連携は後ほど有効になります。（この文は削除予定）
      </p>

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

        <!-- 問題数が多い(本番26問)ため、一覧部分だけを内側スクロールさせる -->
        <div class="question-rows">
          <!-- 1行はsummary(問題番号+問題文+正解)。選択肢・倍率・操作は折り畳み内 -->
          <details
            v-for="question in questions"
            :key="question.id"
            class="question-row"
          >
            <summary class="question-row-summary">
              <span class="question-id">{{ formatQuestionId(question.id) }}</span>
              <span class="question-text">{{ question.questionText }}</span>
              <span
                class="correct-badge"
                :title="`正解: ${correctChoiceText(question)}`"
              >
                {{ formatCorrectBadge(question) }}
              </span>
            </summary>

            <div class="question-row-detail">
              <ul class="question-choices">
                <li
                  v-for="key in CHOICE_KEYS"
                  :key="key"
                  :class="{ 'is-correct': key === question.correctAnswer }"
                >
                  <span class="choice-key">{{ key }}</span>
                  {{ question.choices[key] }}
                </li>
              </ul>

              <div class="question-row-foot">
                <span class="multiplier-chip">{{ formatMultiplierChip(question) }}</span>
                <div class="question-row-actions">
                  <NuxtLink
                    class="row-action-link"
                    :to="`/admin/problems/${question.id}/edit`"
                  >
                    編集
                  </NuxtLink>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  </main>
</template>
