<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchConfidenceMultipliers, fetchQuestions } from '~/features/problems/api/client'
import { CHOICE_KEYS, CONFIDENCE_LEVEL_LABELS, CONFIDENCE_LEVELS } from '~/features/problems/constants'
import type { ConfidenceLevel, ConfidenceMultipliers, Question } from '~/features/problems/types'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import {
  correctChoiceText,
  formatCorrectBadge,
  formatQuestionId,
} from '~/features/problems/components/QuestionRow'
import ConfidenceMultiplierModal from '~/features/problems/components/ConfidenceMultiplierModal.vue'
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
const isMultiplierModalOpen = ref(false)
// 自信度あり/普通/なし3段階の倍率。問題数の隣に現在値を表示するため一覧読み込みと合わせて取得する
const confidenceMultipliers = ref<ConfidenceMultipliers | null>(null)

async function loadQuestions() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [loadedQuestions, loadedMultipliers] = await Promise.all([
      fetchQuestions(),
      fetchConfidenceMultipliers(),
    ])
    questions.value = loadedQuestions
    confidenceMultipliers.value = loadedMultipliers
  }
  catch (error) {
    errorMessage.value = toApiError(error).message
  }
  finally {
    isLoading.value = false
  }
}

function openMultiplierModal() {
  isMultiplierModalOpen.value = true
}

function closeMultiplierModal() {
  isMultiplierModalOpen.value = false
}

function handleMultiplierUpdated(level: ConfidenceLevel, value: string) {
  if (confidenceMultipliers.value != null) {
    confidenceMultipliers.value[level] = value
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
        <NuxtLink class="admin-sidebar-link" to="/admin/quiz-control">イベント開始</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/management">問題管理</NuxtLink>
      </nav>
    </aside>

    <section class="admin-card problems-card">
      <header class="problems-header">
        <div>
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
        <div class="question-count-row">
          <div class="question-count-group">
            <p
              class="question-count"
              role="status"
            >
              全 {{ questions.length }} 問
            </p>
            <template v-if="confidenceMultipliers">
              <span
                v-for="level in CONFIDENCE_LEVELS"
                :key="level"
                class="multiplier-chip"
              >
                {{ CONFIDENCE_LEVEL_LABELS[level] }} ×{{ confidenceMultipliers[level] }}
              </span>
            </template>
          </div>
          <button
            type="button"
            class="multiplier-manage-button"
            aria-haspopup="dialog"
            @click="openMultiplierModal"
          >
            倍率を変更
          </button>
        </div>

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
              <div
                v-if="question.imageUrl"
                class="question-image"
              >
                <img
                  :src="question.imageUrl"
                  :alt="`${formatQuestionId(question.id)}の画像`"
                >
              </div>

              <div class="question-choices-row">
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

    <ConfidenceMultiplierModal
      v-if="isMultiplierModalOpen"
      @close="closeMultiplierModal"
      @updated="handleMultiplierUpdated"
    />
  </main>
</template>
