<script setup lang="ts">
import { computed, ref } from 'vue'
import LoadingSkeleton from '~/components/LoadingSkeleton.vue'
import QuizCloseCountdownBar from '~/components/QuizCloseCountdownBar.vue'
import QuizClockPanel from '~/features/quiz-control/components/QuizClockPanel.vue'
import QuizPhasePanel from '~/features/quiz-control/components/QuizPhasePanel.vue'
import QuizCurrentQuestionCard from '~/features/quiz-control/components/QuizCurrentQuestionCard.vue'
import QuizTimerPanel from '~/features/quiz-control/components/QuizTimerPanel.vue'
import QuizNextQuestionPreview from '~/features/quiz-control/components/QuizNextQuestionPreview.vue'
import { useQuizControl } from '~/features/quiz-control/useQuizControl'
import { useQuizClock } from '~/features/quiz-control/useQuizClock'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import '~/assets/css/quiz-control.css'

useSeoMeta({
  title: 'クイズ出題管理画面',
  description: 'イベント開始から問題公開・解答締め切り・答え表示までを管理する画面です。',
})

const { now } = useQuizClock(1000)
const {
  state,
  history,
  isLoading,
  isActing,
  errorMessage,
  noticeMessage,
  resetOperation,
  phase,
  phaseLabel,
  refresh,
  start,
  publish,
  close,
  closeImmediately,
  reveal,
  finish,
  reset,
  setCorrectAnswer,
} = useQuizControl()

const RESET_CONFIRMATION = 'RESET'
const RESET_DELETION_WARNING = '参加者登録情報（プロフィール）、参加者セッション、リアクション、回答、自信度選択、問題の公開履歴は永久に削除され、元に戻せません。'
const RESET_PRESERVED_DATA = '問題データ、添付ファイル、倍率などの設定は削除されません。'
const isResetImpactModalOpen = ref(false)
const isResetInputModalOpen = ref(false)
const resetConfirmation = ref('')
const canSubmitReset = computed(() => resetConfirmation.value === RESET_CONFIRMATION)

function openResetImpactConfirmation() {
  if (isActing.value) return
  isResetImpactModalOpen.value = true
}

function cancelResetConfirmation() {
  if (isActing.value) return
  isResetImpactModalOpen.value = false
  isResetInputModalOpen.value = false
  resetConfirmation.value = ''
}

function continueToResetInput() {
  if (isActing.value) return
  isResetImpactModalOpen.value = false
  isResetInputModalOpen.value = true
  resetConfirmation.value = ''
}

async function submitReset() {
  if (isActing.value || !canSubmitReset.value) return

  if (await reset(resetConfirmation.value)) cancelResetConfirmation()
}

const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()

function handleAutomaticExpiry() {
  // This event is only for the server-validated per-question deadline. Manual
  // close continues to use the participant-visible ten-second countdown.
  if (phase.value !== 'PUBLISHED') return
  closeImmediately()
}

// 中継問題は正解が未確定のまま登録されうる(既定値はプレースホルダ)。運営が
// ライブ中に明示的に確定させる前に「答え表示」が押されると、参加者に仮の
// 正解が公開されてしまうため、その間はボタン自体を無効化する。
const revealBlockedReason = computed(() => {
  const current = state.value?.current
  if (!current) return null
  if (current.is_relay_question !== true || current.is_selected_relay_question !== true) return null
  if (current.live_correct_answer_confirmed === true) return null

  return '中継問題の正解が未確定です。上の「中継問題の正解」から選択してから答え表示してください。'
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

    <section class="admin-card quiz-control-card">
      <QuizCloseCountdownBar
        :phase="state?.phase ?? null"
        :phase-started-at="state?.phase_started_at ?? null"
        :now="now"
      />
      <header class="quiz-control-header">
        <div>
          <p class="eyebrow">
            クイズ大会
          </p>
          <h1>クイズ出題管理画面</h1>
          <p class="muted-copy">
            イベント開始から問題公開・解答締め切り・答え表示までをこの画面から進行します。
          </p>
        </div>
        <span
          v-if="state"
          class="quiz-phase-badge"
          :data-phase="phase"
        >
          {{ phaseLabel }}
        </span>
        <LoadingSkeleton v-else class="quiz-phase-badge quiz-phase-badge-skeleton" />
      </header>


      <p
        v-if="errorMessage"
        class="status-message error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div
        v-if="isLoading"
        class="quiz-loading-layout"
        role="status"
        aria-busy="true"
      >
        <span class="visually-hidden">クイズの状態を読み込み中…</span>
        <div class="quiz-control-grid">
          <div class="quiz-control-aside">
            <LoadingSkeleton class="quiz-skeleton-panel quiz-skeleton-panel--clock" />
            <LoadingSkeleton class="quiz-skeleton-panel quiz-skeleton-panel--timer" />
          </div>
          <div class="quiz-control-main">
            <LoadingSkeleton class="quiz-skeleton-panel quiz-skeleton-panel--phase" />
            <LoadingSkeleton class="quiz-skeleton-panel quiz-skeleton-panel--question" />
            <LoadingSkeleton class="quiz-skeleton-panel quiz-skeleton-panel--next" />
          </div>
        </div>
      </div>

      <template v-else-if="state">
        <p
          v-if="noticeMessage"
          class="status-message success"
          role="status"
        >
          {{ noticeMessage }}
        </p>

        <section
          v-if="resetOperation"
          class="quiz-reset-receipt"
          aria-labelledby="quiz-reset-receipt-title"
          role="status"
        >
          <div>
            <p class="quiz-reset-kicker">RESET RECEIPT</p>
            <h2 id="quiz-reset-receipt-title">リセット完了の受付票</h2>
            <p class="quiz-reset-receipt-id">操作ID: <code>{{ resetOperation.operation_id }}</code></p>
          </div>
          <dl class="quiz-reset-receipt-counts">
            <div><dt>参加者登録情報（プロフィール）</dt><dd>{{ resetOperation.affected_rows.participants }}件</dd></div>
            <div><dt>参加者セッション</dt><dd>{{ resetOperation.affected_rows.participant_sessions }}件</dd></div>
            <div><dt>リアクション</dt><dd>{{ resetOperation.affected_rows.participant_reactions }}件</dd></div>
            <div><dt>回答</dt><dd>{{ resetOperation.affected_rows.participant_answers }}件</dd></div>
            <div><dt>自信度選択</dt><dd>{{ resetOperation.affected_rows.confidence_selections }}件</dd></div>
            <div><dt>問題の公開履歴</dt><dd>{{ resetOperation.affected_rows.question_reveals }}件</dd></div>
            <div><dt>クイズセッション</dt><dd>{{ resetOperation.affected_rows.quiz_sessions }}件</dd></div>
          </dl>
        </section>

        <div class="quiz-control-grid">
          <!-- 左側: 時間表示(補助情報) -->
          <div class="quiz-control-aside">
            <QuizClockPanel
              :state="state"
              :now="now"
              :history="history"
            />
            <QuizTimerPanel
              :phase="phase"
              :phase-started-at="state.phase_started_at ?? null"
              :time-limit-seconds="state.current?.time_limit_seconds ?? null"
              :finished-elapsed-seconds="state.finished_elapsed_seconds ?? null"
              :question-id="state.current?.question_id ?? null"
              :now="now"
              :is-acting="isActing"
              @expire="handleAutomaticExpiry"
            />
          </div>

          <!-- 右側: 進行管理(現在の問題が主、次問プレビューは補助) -->
          <div class="quiz-control-main">
            <QuizPhasePanel
              :state="state"
              :is-acting="isActing"
              :reveal-blocked-reason="revealBlockedReason"
              @start="start"
              @publish="publish"
              @close="close"
              @reveal="reveal"
              @finish="finish"
            />
            <QuizCurrentQuestionCard :state="state" :is-acting="isActing" @correct-answer="setCorrectAnswer" />
            <QuizNextQuestionPreview v-if="phase !== 'FINISHED'" :next-question="state.next_question ?? null" />
          </div>
        </div>

        <section class="quiz-reset-area" aria-labelledby="quiz-reset-title">
          <div>
            <p class="quiz-reset-kicker">DESTRUCTIVE ACTION</p>
            <h2 id="quiz-reset-title">クイズ大会をリセット</h2>
            <p>
              {{ RESET_DELETION_WARNING }} クイズの進行状態は開始前に戻ります。{{ RESET_PRESERVED_DATA }}
            </p>
          </div>
          <button
            type="button"
            class="quiz-reset-button"
            :disabled="isActing"
            @click="openResetImpactConfirmation"
          >
            リセットを開始
          </button>
        </section>

        <p class="quiz-control-note">
          状態は5秒ごとに自動更新されます。最新の状態を確認したい場合は
          <button
            type="button"
            class="quiz-refresh-button"
            :disabled="isActing"
            @click="() => refresh()"
          >
            今すぐ更新
          </button>
        </p>
        <div
          v-if="isResetImpactModalOpen"
          class="quiz-reset-modal-backdrop"
          role="presentation"
          @click.self="cancelResetConfirmation"
        >
          <section
            class="quiz-reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-reset-impact-title"
            aria-describedby="quiz-reset-impact-description"
            tabindex="-1"
            @keydown.esc="cancelResetConfirmation"
          >
            <p class="quiz-reset-kicker">CONFIRM RESET</p>
            <h2 id="quiz-reset-impact-title">クイズ大会をリセットしますか？</h2>
            <p id="quiz-reset-impact-description">
              これは取り消せない破壊的操作です。{{ RESET_DELETION_WARNING }} クイズの進行状態は開始前に戻ります。{{ RESET_PRESERVED_DATA }}
            </p>
            <div class="quiz-reset-dialog-actions">
              <button type="button" class="quiz-reset-cancel-button" autofocus :disabled="isActing" @click="cancelResetConfirmation">
                戻る
              </button>
              <button type="button" class="quiz-reset-danger-button" :disabled="isActing" @click="continueToResetInput">
                影響を確認して続ける
              </button>
            </div>
          </section>
        </div>

        <div
          v-if="isResetInputModalOpen"
          class="quiz-reset-modal-backdrop"
          role="presentation"
          @click.self="cancelResetConfirmation"
        >
          <section
            class="quiz-reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-reset-input-title"
            aria-describedby="quiz-reset-input-description"
            :aria-busy="isActing"
            tabindex="-1"
            @keydown.esc="cancelResetConfirmation"
          >
            <p class="quiz-reset-kicker">FINAL CONFIRMATION</p>
            <h2 id="quiz-reset-input-title">最終確認</h2>
            <p id="quiz-reset-input-description">
              {{ RESET_DELETION_WARNING }} クイズの進行状態は開始前に戻ります。{{ RESET_PRESERVED_DATA }}
              実行する場合は、下の入力欄に半角大文字で <strong>RESET</strong> と入力してください。
            </p>
            <form @submit.prevent="submitReset">
              <label class="quiz-reset-input-label" for="quiz-reset-confirmation">確認文字列</label>
              <input
                id="quiz-reset-confirmation"
                v-model="resetConfirmation"
                autofocus
                class="quiz-reset-input"
                type="text"
                inputmode="text"
                autocomplete="off"
                spellcheck="false"
                :disabled="isActing"
                :aria-invalid="resetConfirmation.length > 0 && !canSubmitReset"
                aria-describedby="quiz-reset-input-description quiz-reset-input-hint"
              >
              <p id="quiz-reset-input-hint" class="quiz-reset-input-hint">入力値: {{ resetConfirmation || '未入力' }}</p>
              <p v-if="errorMessage" class="quiz-reset-modal-error" role="alert">{{ errorMessage }}</p>
              <div class="quiz-reset-dialog-actions">
                <button type="button" class="quiz-reset-cancel-button" :disabled="isActing" @click="cancelResetConfirmation">
                  キャンセル
                </button>
                <button type="submit" class="quiz-reset-danger-button" :disabled="isActing || !canSubmitReset">
                  {{ isActing ? 'リセット実行中…' : 'リセットを実行' }}
                </button>
              </div>
            </form>
          </section>
        </div>
      </template>
    </section>
  </main>
</template>
