<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  deleteQuestion,
  fetchConfidenceMultipliers,
  fetchQuestions,
  selectRelayQuestion,
} from '~/features/problems/api/client'
import { CHOICE_KEYS, CONFIDENCE_LEVEL_LABELS, CONFIDENCE_LEVELS, formatMultiplier } from '~/features/problems/constants'
import type { ConfidenceLevel, ConfidenceMultipliers, Question } from '~/features/problems/types'
import { choiceText, correctChoiceText, formatCorrectBadge, formatQuestionPosition, formatTimeLimit } from '~/features/problems/components/QuestionRow'
import LoadingSkeleton from '~/components/LoadingSkeleton.vue'
import ConfidenceMultiplierModal from '~/features/problems/components/ConfidenceMultiplierModal.vue'
import QuestionDeleteDialog from '~/features/problems/components/QuestionDeleteDialog.vue'
import QuestionPreviewModal from '~/features/problems/components/QuestionPreviewModal.vue'
import QuestionAddModal from '~/features/problems/components/QuestionAddModal.vue'
import QuestionEditModal from '~/features/problems/components/QuestionEditModal.vue'
import { deleteQuestionErrorMessage, problemErrorMessage } from '~/features/problems/validation'
import { toApiError } from '~/lib/api/error'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import '~/assets/css/management.css'

useSeoMeta({
  title: '問題管理',
  description: '登録済みの問題を確認、追加、編集、削除できます。',
})

const questions = ref<Question[]>([])
const isQuestionsLoading = ref(true)
const isQuestionsRefreshing = ref(false)
const hasLoadedQuestions = ref(false)
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
const relaySelectionSavingId = ref<number | null>(null)
const relaySelectionErrorMessage = ref('')
const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()

async function loadQuestions() {
  const isInitialLoad = !hasLoadedQuestions.value
  hasLoadedQuestions.value = true
  if (isInitialLoad) isQuestionsLoading.value = true
  else isQuestionsRefreshing.value = true
  questionsErrorMessage.value = ''
  try {
    questions.value = await fetchQuestions()
  }
  catch (error) {
    const apiError = toApiError(error)
    questionsErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    if (isInitialLoad) isQuestionsLoading.value = false
    else isQuestionsRefreshing.value = false
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
    deleteErrorMessage.value = deleteQuestionErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    isDeleting.value = false
  }
}

function handleMultiplierUpdated(level: ConfidenceLevel, value: string) {
  if (confidenceMultipliers.value != null) confidenceMultipliers.value[level] = value
}

/**
 * 中継問題の「今回出題する1問」を選択/選択解除する。
 * 選択すると他の中継問題の選択は自動的に解除される(バックエンドが保証)ため、
 * 一覧全体を再読み込みして状態を揃える。
 */
/**
 * 中継問題の一覧バッジ文言。ライブ出題中/選択中/出題済み(選択解除後も含む)/
 * 未選択・未出題の4状態を運営者に区別できるようにする。
 * isLiveQuestion(ライブ進行画面で現在出題中)は isSelectedRelayQuestion(「今回の
 * 出題」として選択済みか)とは独立した別状態のため、優先して表示する。
 * (例: 選択済みのまま正解を公開した直後、「次の問題へ」を押すまではライブ扱いの
 * ままで、選択中バッジだけでは正解を編集できない理由が伝わらないため。)
 */
function relayBadgeText(question: Question): string {
  if (question.isLiveQuestion) return '中継問題・ライブ出題中'
  if (question.isSelectedRelayQuestion) return '中継問題・選択中'
  if (question.revealedAt) return '中継問題・出題済み'
  return '中継問題'
}

async function toggleRelaySelection(question: Question) {
  if (relaySelectionSavingId.value !== null) return

  relaySelectionSavingId.value = question.id
  relaySelectionErrorMessage.value = ''
  try {
    const savedQuestion = await selectRelayQuestion(question, !question.isSelectedRelayQuestion)
    patchQuestion(savedQuestion)
    // Relay selection changes can affect every relay row. Keep the response patch
    // visible immediately, then reconcile all rows with the backend in the background.
    void loadQuestions()
  }
  catch (error) {
    const apiError = toApiError(error)
    relaySelectionErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    relaySelectionSavingId.value = null
  }
}

function patchQuestion(question: Question) {
  const currentIndex = questions.value.findIndex(item => item.id === question.id)
  const patchedQuestions = questions.value.map((item) => {
    if (item.id === question.id) return question
    if (question.isRelayQuestion && question.isSelectedRelayQuestion && item.isRelayQuestion) {
      return { ...item, isSelectedRelayQuestion: false }
    }
    return item
  })

  if (currentIndex === -1) patchedQuestions.push(question)
  questions.value = patchedQuestions.sort((left, right) => left.position - right.position)
}

function closeAddModal() {
  isAddModalOpen.value = false
}

function handleQuestionAdded(question: Question) {
  patchQuestion(question)
  isAddModalOpen.value = false
  void loadQuestions()
}

function closeEditModal() {
  editingQuestion.value = null
}

function handleQuestionEdited(question: Question) {
  patchQuestion(question)
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
          <p v-if="!isQuestionsLoading && (!questionsErrorMessage || questions.length > 0)" class="question-count" role="status">全 {{ questions.length }} 問</p>
          <span v-if="isMultipliersLoading" class="multiplier-status multiplier-status-skeleton" role="status" aria-busy="true">
            <span class="visually-hidden">倍率を読み込み中…</span>
            <LoadingSkeleton v-for="level in CONFIDENCE_LEVELS" :key="level" class="multiplier-chip-skeleton" />
          </span>
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

      <p v-if="relaySelectionErrorMessage" class="status-message error" role="alert">
        中継問題の選択に失敗しました。{{ relaySelectionErrorMessage }}
      </p>
      <div v-if="isQuestionsRefreshing" class="question-refresh-status" role="status" aria-busy="true">
        問題一覧を更新中…
      </div>
      <div v-else-if="questionsErrorMessage && questions.length > 0" class="question-refresh-status is-error" role="alert">
        問題一覧の更新に失敗しました。{{ questionsErrorMessage }}
        <button type="button" class="retry-button" @click="loadQuestions">再読み込み</button>
      </div>

      <div
        v-if="isQuestionsLoading"
        class="question-list question-list-skeleton"
        role="status"
        aria-busy="true"
      >
        <span class="visually-hidden">問題を読み込み中…</span>
        <div class="question-rows">
          <div v-for="index in 5" :key="index" class="question-row question-row-skeleton">
            <LoadingSkeleton class="question-skeleton-id" />
            <LoadingSkeleton class="question-skeleton-text" />
            <LoadingSkeleton class="question-skeleton-badge" />
          </div>
        </div>
      </div>
      <div v-else-if="questionsErrorMessage && questions.length === 0" class="questions-error">
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
              <span class="points-badge">配点 {{ question.points }}点</span>
              <span
                v-if="question.isRelayQuestion"
                class="relay-badge"
                :class="{
                  'is-live': question.isLiveQuestion,
                  'is-selected': !question.isLiveQuestion && question.isSelectedRelayQuestion,
                  'is-revealed': !question.isLiveQuestion && !question.isSelectedRelayQuestion && !!question.revealedAt,
                }"
              >{{ relayBadgeText(question) }}</span>
              <span class="correct-badge" :title="`正解: ${correctChoiceText(question)}`">{{ formatCorrectBadge(question) }}</span>
            </summary>
            <div class="question-row-detail">
              <div v-if="question.isRelayQuestion" class="relay-selection-row">
                <button
                  type="button"
                  class="relay-select-toggle"
                  :class="{ 'is-selected': question.isSelectedRelayQuestion }"
                  :disabled="relaySelectionSavingId !== null"
                  @click="toggleRelaySelection(question)"
                >
                  {{ question.isSelectedRelayQuestion ? '今回の出題の選択を解除' : '今回の出題として選択' }}
                </button>
                <p v-if="question.isLiveQuestion" class="relay-selection-note is-live">
                  この問題は現在ライブ進行画面で出題中(または直前に出題済み)のため、選択状態に関わらず正解を編集できません。「出題管理」で次の問題に進んでから変更してください。
                </p>
                <p v-else-if="!question.isSelectedRelayQuestion && !question.revealedAt" class="relay-selection-note">
                  中継問題は複数登録できますが、今回出題する1問を選択するまで正解を編集できません。
                </p>
                <p v-else-if="!question.isSelectedRelayQuestion" class="relay-selection-note is-revealed">
                  この問題はすでに出題・正解公開済みのため、選択が外れていても正解を編集できます。
                </p>
              </div>
              <p v-if="question.targetAudience" class="question-target-audience">
                出題対象: {{ question.targetAudience }}
              </p>
              <p class="question-time-limit">
                制限時間: {{ formatTimeLimit(question) }}
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

    <ConfidenceMultiplierModal
      v-if="isMultiplierModalOpen"
      :initial-multipliers="confidenceMultipliers"
      @close="isMultiplierModalOpen = false"
      @updated="handleMultiplierUpdated"
    />
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
