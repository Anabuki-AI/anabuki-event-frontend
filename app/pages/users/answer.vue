<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
  selectedChoice,
  selectedChoiceText,
  selectedMultiplier,
  isConfidenceConfirmOpen,
  isConfirmingConfidence,
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
          {{ participant ? `${participant.displayName} さん` : '参加情報を確認しています…' }}
        </p>
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

      <section v-if="screen === 'loading'" class="answer-card" aria-live="polite">
        <p class="muted-copy">
          クイズの状態を確認しています…
        </p>
      </section>

      <section v-else-if="screen === 'finished'" class="answer-card" aria-live="polite">
        <ParticipantQuizFinishedPanel />
      </section>

      <section v-else-if="screen === 'answer' && question" class="answer-card">
        <div class="question-panel">
          <p class="question-number">
            Q{{ question.position }}
          </p>
          <p class="question-text">
            {{ question.question_text }}
          </p>
          <img v-if="question.image_url" class="question-image" :src="resolveApiImageUrl(question.image_url) ?? undefined" alt="">
        </div>

        <div class="confidence-field">
          <p class="confidence-label">
            レベルを先に確定してください
          </p>
          <p v-if="!isConfidenceLocked" class="confidence-help">
            一度確定すると変更できません。Lv.1は不正解の選択肢を1つ減らします。
          </p>
          <p v-else class="confidence-help">
            {{ confidenceOptions.find(option => option.value === lockedConfidenceLevel)?.label }}を確定済みです。レベルは変更できません。
          </p>
          <div class="confidence-list">
            <button
              v-for="option in confidenceOptions"
              :key="option.value"
              type="button"
              class="confidence-item"
              :class="{ 'is-selected': lockedConfidenceLevel === option.value, 'is-locked': isConfidenceLocked }"
              :aria-pressed="lockedConfidenceLevel === option.value"
              :disabled="isConfidenceLocked || isConfirmingConfidence"
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
        </div>

        <p v-if="confidenceMessage" class="status-message error" role="alert">
          {{ confidenceMessage }}
        </p>

        <p v-if="!isConfidenceLocked" class="answer-note">
          レベルを確定すると、回答の選択肢を表示します。
        </p>

        <template v-else>
          <div class="choice-list">
            <button
              v-for="choice in choices"
              :key="choice.key"
              type="button"
              class="choice-item"
              :class="{ 'is-selected': selectedChoice === choice.key }"
              :aria-pressed="selectedChoice === choice.key"
              :disabled="isSubmitting"
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

          <div class="point-panel">
            <p class="point-summary">
              現在の選択：{{ selectedChoiceText }}／レベル：{{ confidenceOptions.find(option => option.value === lockedConfidenceLevel)?.label }}
            </p>
            <p class="point-value">
              {{ selectedMultiplier }}
            </p>
            <p class="point-caption">
              Lv.3で不正解の場合は、問題の配点の半分を減点します。
            </p>
          </div>

          <p v-if="submissionMessage" class="status-message error" role="alert">
            {{ submissionMessage }}
          </p>
          <p class="answer-note">
            レベルは変更できません。回答は送信すると変更できません。
          </p>

          <button
            type="button"
            class="answer-submit"
            :disabled="!canSubmit"
            @click="submitAnswer"
          >
            {{ isSubmitting ? '解答を送信しています…' : 'この内容で解答する' }}
          </button>
        </template>

        <div v-if="isConfidenceConfirmOpen" class="confidence-confirmation-backdrop" @click.self="cancelConfidenceSelection">
          <section class="confidence-confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="lv1-confirm-title">
            <h2 id="lv1-confirm-title">Lv.1を確定しますか？</h2>
            <p>確定するとレベルは変更できません。不正解の選択肢を1つ減らしてから回答します。</p>
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
          After submit
        </p>
        <h2>解答を送信しました</h2>
        <p class="muted-copy">
          正答と得点の公開をお待ちください。
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
        <p class="muted-copy">
          正答と得点の公開をお待ちください。
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
            {{ myAnswer ? `${myAnswer.choice}（自信度 ${myAnswerConfidenceLabel}）` : '解答なし' }}
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
