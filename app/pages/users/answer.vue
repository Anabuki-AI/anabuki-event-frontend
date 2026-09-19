<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LoadingSkeleton from '~/components/LoadingSkeleton.vue'
import QuizCloseCountdownBar from '~/components/QuizCloseCountdownBar.vue'
import ParticipantQuizFinishedPanel from '~/features/participant-quiz/components/ParticipantQuizFinishedPanel.vue'
import { useQuizClock } from '~/features/quiz-control/useQuizClock'
import { useParticipantQuizAnswer } from '~/features/participant-quiz/composables/use-participant-quiz-answer'
import { CONFIDENCE_LEVEL_LABELS } from '~/features/participant-quiz/types'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import type { Participant } from '~/features/participants/types'
import { ApiError } from '~/lib/api/error'
import { resolveApiImageUrl } from '~/lib/api/image'

import '~/assets/css/answer.css'

useSeoMeta({
  title: '解答画面',
  description: 'クイズの解答を選択して送信する、一般ユーザー向けページです。',
})

const { now } = useQuizClock(1000)
const participant = ref<Participant>()
const participantError = ref('')
const isRedirecting = ref(false)

function redirectToRegistration() {
  if (isRedirecting.value) return
  isRedirecting.value = true
  void navigateTo('/participants/new')
}

function redirectToWaiting() {
  if (isRedirecting.value) return
  isRedirecting.value = true
  void navigateTo('/participants/waiting')
}

const {
  state,
  question,
  myAnswer,
  correctAnswer,
  loadError,
  screen,
  choices,
  confidenceOptions,
  lockedConfidenceLevel,
  isConfidenceLocked,
  isLiveRelayQuestion,
  eliminatedChoice,
  selectedChoice,
  selectedChoiceText,
  selectedMultiplier,
  savedChoice,
  hasDraftChange,
  isEditingAnswer,
  isAnswerWindowOpen,
  beginAnswerEditing,
  cancelAnswerEditing,
  isConfidenceConfirmOpen,
  isConfirmingConfidence,
  pendingConfidenceLevel,
  confidenceMessage,
  isSubmitting,
  canSubmit,
  submissionMessage,
  selectConfidenceLevel,
  cancelConfidenceSelection,
  confirmPendingConfidenceSelection,
  submitAnswer,
} = useParticipantQuizAnswer({
  onWaiting: redirectToWaiting,
  onUnauthorized: redirectToRegistration,
})

const correctChoiceText = computed(() => choices.value.find(choice => choice.key === correctAnswer.value)?.text)
const myAnswerConfidenceLabel = computed(() => myAnswer.value && CONFIDENCE_LEVEL_LABELS[myAnswer.value.confidence_level])
const savedChoiceText = computed(() => {
  const saved = choices.value.find(choice => choice.key === savedChoice.value)
  return saved ? `${saved.key}. ${saved.text}` : '未選択'
})

onMounted(async () => {
  try {
    participant.value = await getCurrentParticipant()
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      redirectToRegistration()
      return
    }
    participantError.value = '参加情報を確認できませんでした。通信状況を確認して再読み込みしてください。'
  }
})
</script>

<template>
  <div class="page-shell answer-shell">
    <QuizCloseCountdownBar
      :phase="state?.phase ?? null"
      :phase-started-at="state?.phase_started_at ?? null"
      :now="now"
    />
    <header class="answer-header">
      <div class="answer-heading">
        <p class="eyebrow">
          Quiz
        </p>
        <h1>解答画面</h1>
        <p class="answer-user-name">
          {{ participant ? `${participant.displayName} さん` : '参加者 さん' }}
        </p>
        <span v-if="!participant && !participantError" class="visually-hidden" role="status">
          参加情報を確認しています…
        </span>
      </div>
      <NuxtLink
        class="help-button"
        to="/participants/help"
      >
        ヘルプ
      </NuxtLink>
    </header>

    <main class="answer-main">
      <p v-if="participantError" class="status-message error" role="alert">
        {{ participantError }}
      </p>
      <p v-if="loadError && !(loadError instanceof ApiError && loadError.statusCode === 401)" class="status-message error" role="alert">
        クイズの最新状態を取得できませんでした。自動的に再試行します。
      </p>

      <section
        v-if="screen === 'loading'"
        class="answer-card answer-loading-card"
        aria-live="polite"
        aria-busy="true"
        role="status"
      >
        <span class="visually-hidden">クイズの状態を確認しています…</span>
        <LoadingSkeleton class="answer-skeleton-question-number" />
        <LoadingSkeleton class="answer-skeleton-question-line answer-skeleton-question-line--long" />
        <LoadingSkeleton class="answer-skeleton-question-line answer-skeleton-question-line--short" />
        <div class="answer-skeleton-confidence">
          <LoadingSkeleton class="answer-skeleton-label" />
          <div class="answer-skeleton-confidence-list">
            <LoadingSkeleton v-for="index in 3" :key="index" class="answer-skeleton-confidence-item" />
          </div>
        </div>
        <div class="answer-skeleton-choices">
          <LoadingSkeleton v-for="index in 4" :key="index" class="answer-skeleton-choice" />
        </div>
        <LoadingSkeleton class="answer-skeleton-point" />
        <LoadingSkeleton class="answer-skeleton-submit" />
      </section>

      <section v-else-if="screen === 'finished'" class="answer-card" aria-live="polite">
        <ParticipantQuizFinishedPanel />
        <NuxtLink class="primary-link answer-ranking-link" to="/rankings">
          ランキングを表示する
        </NuxtLink>
      </section>

      <section v-else-if="(screen === 'answer' || isEditingAnswer) && question" class="answer-card">
        <div class="question-panel">
          <p class="question-number">
            Q{{ question.position }}
          </p>
          <p class="question-text">
            {{ question.question_text }}
          </p>
          <img v-if="question.image_url" class="question-image" :src="resolveApiImageUrl(question.image_url) ?? undefined" alt="">
        </div>

        <div class="choice-list">
          <button
            v-for="choice in choices"
            :key="choice.key"
            type="button"
            class="choice-item"
            :class="{ 'is-selected': selectedChoice === choice.key, 'is-eliminated': choice.eliminated }"
            :aria-pressed="selectedChoice === choice.key"
            :disabled="isSubmitting || choice.eliminated"
            @click="selectedChoice = choice.key"
          >
            <span class="choice-key">
              {{ choice.key }}
            </span>
            <span class="choice-text">
              {{ choice.text }}
            </span>
            <span class="choice-check" aria-hidden="true">✓</span>
          </button>
        </div>
        <p v-if="eliminatedChoice" class="answer-note" role="status">
          グレーアウトされた選択肢は不正解です。選択できません。
        </p>

        <div class="confidence-field">
          <p class="confidence-label">
            自信度
          </p>
          <p v-if="!isConfidenceLocked" class="confidence-help">
            <template v-if="isLiveRelayQuestion">
              ライブ問題は正解・不正解が未確定のため、自信度「なし」は選択できません。「普通」と「あり」は送信まで自由に変更できます。
            </template>
            <template v-else>
              「普通」と「あり」は送信まで自由に変更できます。「なし」は1度だけ選べて、不正解の選択肢を1つグレーアウトします。確定後は変更できません。
            </template>
          </p>
          <p v-else class="confidence-help">
            {{ confidenceOptions.find(option => option.value === lockedConfidenceLevel)?.label }}を確定済みです。自信度は変更できません。
          </p>
          <div class="confidence-list">
            <button
              v-for="option in confidenceOptions"
              :key="option.value"
              type="button"
              class="confidence-item"
              :class="{ 'is-selected': lockedConfidenceLevel === option.value, 'is-pending': pendingConfidenceLevel === option.value, 'is-locked': isConfidenceLocked }"
              :aria-pressed="lockedConfidenceLevel === option.value || pendingConfidenceLevel === option.value"
              :disabled="isConfidenceLocked || isConfirmingConfidence || (isLiveRelayQuestion && option.value === 'low')"
              @click="selectConfidenceLevel(option.value)"
            >
              <span class="confidence-name">
                {{ option.label }}
              </span>
              <span class="confidence-rate">
                {{ option.multiplier }}
              </span>
            </button>
          </div>
          <p v-if="isConfirmingConfidence && pendingConfidenceLevel" class="confidence-pending-message" role="status">
            {{ confidenceOptions.find(option => option.value === pendingConfidenceLevel)?.label }}を確定しています…
          </p>
        </div>

        <div class="point-panel">
            <p class="point-summary">
              {{ isEditingAnswer ? '変更後の選択' : '現在の選択' }}：{{ selectedChoiceText }}／自信度：{{ confidenceOptions.find(option => option.value === lockedConfidenceLevel)?.label ?? '未選択' }}
            </p>
            <p v-if="isEditingAnswer" class="point-caption">
              受付済み：{{ savedChoiceText }}
            </p>
            <p v-if="isEditingAnswer && hasDraftChange" class="answer-diff" role="status">
              この変更内容を明示的に送信するまで、受付済み回答は変わりません。
            </p>
            <p class="point-value">
              {{ selectedMultiplier }}
            </p>
            <p class="point-caption">
              自信度「あり」で不正解の場合は、問題の配点の半分を減点します。
            </p>
          </div>

          <p v-if="submissionMessage" class="status-message error" role="alert">
            {{ submissionMessage }}
          </p>
          <p v-if="confidenceMessage" class="status-message error" role="alert">
            {{ confidenceMessage }}
          </p>
          <p class="answer-note">
            {{ isEditingAnswer ? '内容を確認して、変更を送信してください。' : '選択肢を選んで送信してください。自信度は「なし」確定後・解答後は変更できません。' }}
          </p>

          <div v-if="isEditingAnswer" class="answer-edit-actions">
            <button
              type="button"
              class="button-cancel"
              :disabled="isSubmitting"
              @click="cancelAnswerEditing"
            >
              キャンセル
            </button>
            <button
              type="button"
              class="answer-submit"
              :disabled="!canSubmit"
              @click="submitAnswer"
            >
              {{ isSubmitting ? '変更を送信しています…' : '変更を送信する' }}
            </button>
          </div>
          <button
            v-else
            type="button"
            class="answer-submit"
            :disabled="!canSubmit"
            @click="submitAnswer"
          >
            {{ isSubmitting ? '解答を送信しています…' : 'この内容で解答する' }}
          </button>

        <div v-if="isConfidenceConfirmOpen" class="confidence-confirmation-backdrop" @click.self="cancelConfidenceSelection">
          <section class="confidence-confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="lv1-confirm-title">
            <h2 id="lv1-confirm-title">自信度「なし」を確定しますか？</h2>
            <p v-if="selectedChoice">
              選択中の{{ selectedChoiceText }}を残して、他の不正解の選択肢を1つグレーアウトします。
            </p>
            <p v-else>
              不正解の選択肢を1つグレーアウトします。確定すると自信度は変更できません。
            </p>
            <div class="confidence-confirmation-actions">
              <button type="button" class="button-cancel" :disabled="isConfirmingConfidence" @click="cancelConfidenceSelection">いいえ</button>
              <button type="button" class="answer-submit" :disabled="isConfirmingConfidence" @click="confirmPendingConfidenceSelection">
                {{ isConfirmingConfidence ? '確定しています…' : 'はい、確定する' }}
              </button>
            </div>
          </section>
        </div>
      </section>

      <section v-else-if="screen === 'submitted'" class="answer-card" aria-live="polite">
        <p class="eyebrow">
          Answer saved
        </p>
        <h2>解答を受け付けました</h2>
        <div v-if="question" class="answer-review">
          <div class="question-panel">
            <p class="question-number">
              Q{{ question.position }}
            </p>
            <p class="question-text">
              {{ question.question_text }}
            </p>
            <img v-if="question.image_url" class="question-image" :src="resolveApiImageUrl(question.image_url) ?? undefined" alt="">
          </div>
          <div class="choice-list answer-review-choices">
            <button
              v-for="choice in choices"
              :key="choice.key"
              type="button"
              class="choice-item"
              :class="{ 'is-selected': savedChoice === choice.key }"
              disabled
            >
              <span class="choice-key">{{ choice.key }}</span>
              <span class="choice-text">{{ choice.text }}</span>
              <span v-if="savedChoice === choice.key" class="choice-check" aria-hidden="true">✓</span>
            </button>
          </div>
          <div class="point-panel">
            <p class="point-summary">現在の受付済み回答：{{ savedChoiceText }}</p>
            <p class="point-caption">自信度：{{ myAnswerConfidenceLabel }}</p>
          </div>
        </div>
        <p class="muted-copy">
          正答と得点の公開をお待ちください。
        </p>
        <button
          v-if="myAnswer && isAnswerWindowOpen"
          type="button"
          class="answer-edit-button"
          @click="beginAnswerEditing"
        >
          回答を選び直す
        </button>
        <p v-if="myAnswer && isAnswerWindowOpen" class="answer-note">
          選択肢をタップしただけでは変更されません。内容を確認して送信してください。
        </p>
        <div class="wait-state">
          <div class="wait-dots" aria-hidden="true">
            <span class="wait-dot" />
            <span class="wait-dot" />
            <span class="wait-dot" />
          </div>
          <p class="wait-text">
            正答発表を待っています…
          </p>
        </div>
      </section>

      <section v-else-if="screen === 'closed'" class="answer-card" aria-live="polite">
        <h2>解答受付は終了しました</h2>
        <div v-if="question && myAnswer" class="answer-review">
          <div class="question-panel">
            <p class="question-number">
              Q{{ question.position }}
            </p>
            <p class="question-text">
              {{ question.question_text }}
            </p>
          </div>
          <div class="point-panel">
            <p class="point-summary">最終回答：{{ savedChoiceText }}</p>
            <p class="point-caption">自信度：{{ myAnswerConfidenceLabel }}</p>
          </div>
        </div>
        <p class="muted-copy">
          正答と得点の公開をお待ちください。締切後は回答を変更できません。
        </p>
        <div class="wait-state">
          <p class="wait-text">
            正答発表を待っています…
          </p>
        </div>
      </section>

      <section v-else-if="screen === 'revealed' && question" class="answer-card result-card" aria-live="polite">
        <p class="eyebrow">
          Result
        </p>
        <h2>結果発表</h2>
        <div class="result-panel">
          <p class="result-label">
            正解
          </p>
          <p class="result-value">
            {{ correctAnswer }}{{ correctChoiceText ? `. ${correctChoiceText}` : '' }}
          </p>
          <p class="result-label">
            あなたの解答
          </p>
          <p class="result-value">
            {{ myAnswer ? `${savedChoiceText}（自信度 ${myAnswerConfidenceLabel}）` : '解答なし' }}
          </p>
        </div>
        <p class="answer-note">
          次の問題が公開されると、画面が自動的に切り替わります。
        </p>
      </section>

      <section v-else class="answer-card" aria-live="polite">
        <p class="muted-copy">
          次の問題を待っています…
        </p>
      </section>
    </main>
  </div>
</template>
