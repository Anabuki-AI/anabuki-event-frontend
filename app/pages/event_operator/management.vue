<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  deleteQuestion,
  fetchConfidenceMultipliers,
  fetchQuestions,
} from '~/features/problems/api/client'
import { CHOICE_KEYS, CONFIDENCE_LEVEL_LABELS, CONFIDENCE_LEVELS, formatMultiplier } from '~/features/problems/constants'
import type { ConfidenceLevel, ConfidenceMultipliers, Question } from '~/features/problems/types'
import { choiceText, correctChoiceText, formatCorrectBadge, formatQuestionPosition } from '~/features/problems/components/QuestionRow'
import ConfidenceMultiplierModal from '~/features/problems/components/ConfidenceMultiplierModal.vue'
import QuestionDeleteDialog from '~/features/problems/components/QuestionDeleteDialog.vue'
import QuestionPreviewModal from '~/features/problems/components/QuestionPreviewModal.vue'
import QuestionAddModal from './question-add.vue'
import QuestionEditModal from './questione.vue'
import { problemErrorMessage } from '~/features/problems/validation'
import { toApiError } from '~/lib/api/error'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import '~/assets/css/management.css'

useSeoMeta({
  title: '問題管理',
  description: '登録済みの問題を確認、追加、編集、削除できます。',
})

const questions = ref<Question[]>([])
const isQuestionsLoading = ref(true)
const questionsErrorMessage = ref('')
const confidenceMultipliers = ref<ConfidenceMultipliers | null>(null)
const isMultipliersLoading = ref(true)
const multipliersErrorMessage = ref('')
const isMultiplierModalOpen = ref(false)
const deletingQuestion = ref<Question | null>(null)
const isDeleting = ref(false)
const deleteErrorMessage = ref('')
const isAddModalOpen = ref(false)
const editingQuestion = ref<Question | null>(null)
const previewingQuestion = ref<Question | null>(null)
const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()

async function loadQuestions() {
  isQuestionsLoading.value = true
  questionsErrorMessage.value = ''
  try {
    questions.value = await fetchQuestions()
  }
  catch (error) {
    const apiError = toApiError(error)
    questionsErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    isQuestionsLoading.value = false
  }
}

async function loadMultipliers() {
  isMultipliersLoading.value = true
  multipliersErrorMessage.value = ''
  try {
    confidenceMultipliers.value = await fetchConfidenceMultipliers()
  }
  catch (error) {
    const apiError = toApiError(error)
    multipliersErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    isMultipliersLoading.value = false
  }
}

function openDeleteDialog(question: Question) {
  deletingQuestion.value = question
  deleteErrorMessage.value = ''
}

function closeDeleteDialog() {
  if (isDeleting.value) return
  deletingQuestion.value = null
  deleteErrorMessage.value = ''
}

async function confirmDelete() {
  const question = deletingQuestion.value
  if (question == null || isDeleting.value) return

  isDeleting.value = true
  deleteErrorMessage.value = ''
  try {
    await deleteQuestion(question.id)
    questions.value = questions.value.filter(item => item.id !== question.id)
    deletingQuestion.value = null
    // The local update is immediate; revalidate positions and any concurrent changes in the background.
    void loadQuestions()
  }
  catch (error) {
    const apiError = toApiError(error)
    deleteErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    isDeleting.value = false
  }
}

function handleMultiplierUpdated(level: ConfidenceLevel, value: string) {
  if (confidenceMultipliers.value != null) confidenceMultipliers.value[level] = value
}

function closeAddModal() {
  isAddModalOpen.value = false
}

function handleQuestionAdded() {
  isAddModalOpen.value = false
  void loadQuestions()
}

function closeEditModal() {
  editingQuestion.value = null
}

function handleQuestionEdited() {
  editingQuestion.value = null
  void loadQuestions()
}

onMounted(() => {
  void loadQuestions()
  void loadMultipliers()
})
</script>

<template>
  <main class="page-shell admin-shell">
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
        <NuxtLink class="admin-sidebar-link" to="/event_operator/quiz-control">出題管理</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/management">問題管理</NuxtLink>
      </nav>
    </aside>

    <section class="admin-card problems-card" aria-labelledby="problems-title">
      <header class="problems-header">
        <div>
          <p class="eyebrow">Question management</p>
          <h1 id="problems-title">問題管理</h1>
          <p class="muted-copy">登録済みの問題を確認し、追加・編集・削除できます。</p>
        </div>
        <button type="button" class="primary-link add-question-link" @click="isAddModalOpen = true">＋ 問題を追加</button>
      </header>

      <div class="question-count-row">
        <div class="question-count-group">
          <p v-if="!isQuestionsLoading && !questionsErrorMessage" class="question-count" role="status">全 {{ questions.length }} 問</p>
          <span v-if="isMultipliersLoading" class="multiplier-status" role="status">倍率を読み込み中…</span>
          <template v-else-if="confidenceMultipliers">
            <span v-for="level in CONFIDENCE_LEVELS" :key="level" class="multiplier-chip">
              {{ CONFIDENCE_LEVEL_LABELS[level] }} ×{{ formatMultiplier(confidenceMultipliers[level]) }}
            </span>
          </template>
        </div>
        <button type="button" class="multiplier-manage-button" aria-haspopup="dialog" @click="isMultiplierModalOpen = true">倍率を変更</button>
      </div>

      <div v-if="multipliersErrorMessage" class="multiplier-error">
        <p class="status-message error" role="alert">倍率の取得に失敗しました。{{ multipliersErrorMessage }}</p>
        <button type="button" class="retry-button" @click="loadMultipliers">倍率を再読み込み</button>
      </div>

      <p v-if="isQuestionsLoading" class="status-message" role="status">問題を読み込み中…</p>
      <div v-else-if="questionsErrorMessage" class="questions-error">
        <p class="status-message error" role="alert">{{ questionsErrorMessage }}</p>
        <button type="button" class="retry-button" @click="loadQuestions">問題を再読み込み</button>
      </div>
      <p v-else-if="questions.length === 0" class="status-message empty" role="status">
        登録されている問題がありません。「＋ 問題を追加」から最初の問題を登録してください。
      </p>
      <div v-else class="question-list">
        <div class="question-rows">
          <details v-for="question in questions" :key="question.id" class="question-row">
            <summary class="question-row-summary">
              <span class="question-id">{{ formatQuestionPosition(question.position) }}</span>
              <span class="question-text">{{ question.questionText }}</span>
              <span class="correct-badge" :title="`正解: ${correctChoiceText(question)}`">{{ formatCorrectBadge(question) }}</span>
            </summary>
            <div class="question-row-detail">
              <p v-if="question.targetAudience" class="question-target-audience">
                出題対象: {{ question.targetAudience }}
              </p>
              <div class="question-choices-row">
                <ul class="question-choices">
                  <li v-for="key in CHOICE_KEYS" :key="key" :class="{ 'is-correct': key === question.correctAnswer }">
                    <span class="choice-key">{{ key }}</span>{{ choiceText(question, key) }}
                  </li>
                </ul>
                <div class="question-row-actions">
                  <button type="button" class="row-action-link" @click="previewingQuestion = question">プレビュー</button>
                  <button type="button" class="row-action-link" @click="editingQuestion = question">編集</button>
                  <button type="button" class="row-action-button" :aria-label="`${formatQuestionPosition(question.position)}を削除`" @click="openDeleteDialog(question)">削除</button>
                </div>
              </div>
              <p v-if="question.explanation" class="question-explanation">
                解説: {{ question.explanation }}
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>

    <ConfidenceMultiplierModal v-if="isMultiplierModalOpen" @close="isMultiplierModalOpen = false" @updated="handleMultiplierUpdated" />
    <QuestionDeleteDialog
      v-if="deletingQuestion"
      :question="deletingQuestion"
      :is-deleting="isDeleting"
      :error-message="deleteErrorMessage"
      @close="closeDeleteDialog"
      @confirm="confirmDelete"
    />
    <QuestionAddModal v-if="isAddModalOpen" @close="closeAddModal" @saved="handleQuestionAdded" />
    <QuestionEditModal
      v-if="editingQuestion"
      :question="editingQuestion"
      @close="closeEditModal"
      @saved="handleQuestionEdited"
    />
    <QuestionPreviewModal
      v-if="previewingQuestion"
      :question="previewingQuestion"
      @close="previewingQuestion = null"
    />
  </main>
</template>
