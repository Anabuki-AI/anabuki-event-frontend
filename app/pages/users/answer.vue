<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ParticipantQuizFinishedPanel from '~/features/participant-quiz/components/ParticipantQuizFinishedPanel.vue'
import { useParticipantQuizAnswer } from '~/features/participant-quiz/composables/use-participant-quiz-answer'
import { getCurrentParticipant } from '~/features/participants/api/get-current-participant'
import type { Participant } from '~/features/participants/types'
import { ApiError } from '~/lib/api/error'

import '~/assets/css/answer.css'

useSeoMeta({
  title: '解答画面',
  description: 'クイズの解答を選択して送信する、一般ユーザー向けページです。',
})

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
  event,
  question,
  loadError,
  screen,
  choices,
  confidenceOptions,
  selectedChoice,
  confidenceLevel,
  selectedChoiceText,
  selectedMultiplier,
  isSubmitting,
  canSubmit,
  submissionMessage,
  submitAnswer,
} = useParticipantQuizAnswer({
  onWaiting: redirectToWaiting,
  onUnauthorized: redirectToRegistration,
})

const correctChoiceText = computed(() => choices.value.find(choice => choice.key === question.value?.correctAnswer)?.text)

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
            {{ question.questionText }}
          </p>
          <img v-if="question.imageUrl" class="question-image" :src="question.imageUrl" alt="">
        </div>

        <div class="choice-list">
          <button
            v-for="choice in choices"
            :key="choice.key"
            type="button"
            class="choice-item"
            :class="{ 'is-selected': selectedChoice === choice.key }"
            :aria-pressed="selectedChoice === choice.key"
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

        <div class="confidence-field">
          <p class="confidence-label">
            自信度
          </p>
          <div class="confidence-list">
            <button
              v-for="option in confidenceOptions"
              :key="option.value"
              type="button"
              class="confidence-item"
              :class="{ 'is-selected': confidenceLevel === option.value }"
              :aria-pressed="confidenceLevel === option.value"
              @click="confidenceLevel = option.value"
            >
              <span class="confidence-name">
                {{ option.label }}
              </span>
              <span class="confidence-rate">
                ×{{ option.multiplier }}
              </span>
            </button>
          </div>
        </div>

        <div class="point-panel">
          <p class="point-summary">
            現在の選択：{{ selectedChoiceText }}／自信度：{{ confidenceOptions.find(option => option.value === confidenceLevel)?.label }}
          </p>
          <p class="point-value">
            ×{{ selectedMultiplier }}
          </p>
          <p class="point-caption">
            正解時に適用される倍率
          </p>
        </div>

        <p v-if="submissionMessage" class="status-message error" role="alert">
          {{ submissionMessage }}
        </p>
        <p class="answer-note">
          ※ 送信する前なら、選択肢と自信度は何度でも変更できます。
        </p>

        <button
          type="button"
          class="answer-submit"
          :disabled="!canSubmit"
          @click="submitAnswer"
        >
          {{ isSubmitting ? '解答を送信しています…' : 'この内容で解答する' }}
        </button>
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
        <h2>{{ question.myAnswer?.isCorrect ? '正解です！' : '今回の結果' }}</h2>
        <div class="result-panel">
          <p class="result-label">
            正解
          </p>
          <p class="result-value">
            {{ question.correctAnswer }}{{ correctChoiceText ? `. ${correctChoiceText}` : '' }}
          </p>
          <p class="result-label">
            あなたの解答
          </p>
          <p class="result-value">
            {{ question.myAnswer ? `${question.myAnswer.answer}（${question.myAnswer.confidenceLevel}）` : '解答なし' }}
          </p>
          <p class="result-label">
            今回の得点
          </p>
          <p class="result-score">
            {{ question.myAnswer?.points ?? '0.00' }}<span> pt</span>
          </p>
        </div>
        <div class="total-score-panel">
          <p>累計得点</p>
          <strong>{{ event?.totalScore ?? '0.00' }}<span> pt</span></strong>
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
