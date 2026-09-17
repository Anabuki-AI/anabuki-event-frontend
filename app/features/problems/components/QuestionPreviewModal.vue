<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import type { Question } from '../types'
import { resolveQuestionImageUrl } from '../api/client'
import { CHOICE_KEYS } from '../constants'
import { choiceText, formatQuestionPosition } from './QuestionRow'
// 実際の解答画面（users/answer.vue）と同じ構成・見た目にするため、そのCSSをそのまま使う
import '~/assets/css/answer.css'

const props = defineProps<{ question: Question }>()
const emit = defineEmits<{ close: [] }>()

type Confidence = 'あり' | '普通' | 'なし'
interface ConfidenceOption {
  label: Confidence
  rate: string
}

// users/answer.vue（見た目確認用ダミー）と同じ自信度選択肢・倍率。プレビュー専用で送信は行わない。
const confidenceOptions: ConfidenceOption[] = [
  { label: 'あり', rate: '×1.5' },
  { label: '普通', rate: '×1.0' },
  { label: 'なし', rate: '×0.5' },
]
// 獲得予定ポイントの基礎点は、この問題に設定された配点（question.points）を使う。
const CONFIDENCE_RATE: Record<Confidence, number> = { あり: 1.5, 普通: 1, なし: 0.5 }

const imageUrl = resolveQuestionImageUrl(props.question.imageUrl)
const selectedChoice = ref<Question['correctAnswer'] | null>(null)
const confidence = ref<Confidence>('普通')
const submitted = ref(false)
const panel = ref<HTMLElement | null>(null)
const titleId = useId()

const selectedChoiceText = computed(() => {
  if (selectedChoice.value === null) return '未選択'
  return `${selectedChoice.value}. ${choiceText(props.question, selectedChoice.value)}`
})
const expectedPoint = computed(() => Math.round(props.question.points * CONFIDENCE_RATE[confidence.value]))

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  panel.value?.focus()
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="multiplier-modal" @click.self="emit('close')">
    <section ref="panel" class="multiplier-modal-panel preview-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
      <div class="multiplier-modal-head">
        <h2 :id="titleId">{{ formatQuestionPosition(question.position) }} プレビュー</h2>
        <button type="button" class="multiplier-modal-close" aria-label="閉じる" @click="emit('close')">×</button>
      </div>
      <p class="preview-note">
        スマートフォンの解答画面にどのように表示されるかのイメージです。
      </p>

      <div class="preview-phone">
        <div class="answer-shell">
          <main class="answer-main">
            <section v-if="!submitted" class="answer-card">
              <div class="question-panel">
                <p class="question-number">
                  {{ formatQuestionPosition(question.position) }}
                </p>
                <p v-if="question.targetAudience" class="preview-target-audience">
                  対象: {{ question.targetAudience }}
                </p>
                <p class="question-text">
                  {{ question.questionText }}
                </p>
                <img v-if="imageUrl" class="preview-question-image" :src="imageUrl" alt="">
              </div>

              <div class="choice-list">
                <button
                  v-for="key in CHOICE_KEYS"
                  :key="key"
                  type="button"
                  class="choice-item"
                  :class="{ 'is-selected': selectedChoice === key }"
                  :aria-pressed="selectedChoice === key"
                  @click="selectedChoice = key"
                >
                  <span class="choice-key">{{ key }}</span>
                  <span class="choice-text">{{ choiceText(question, key) }}</span>
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
                    :key="option.label"
                    type="button"
                    class="confidence-item"
                    :class="{ 'is-selected': confidence === option.label }"
                    :aria-pressed="confidence === option.label"
                    @click="confidence = option.label"
                  >
                    <span class="confidence-name">{{ option.label }}</span>
                    <span class="confidence-rate">{{ option.rate }}</span>
                  </button>
                </div>
              </div>

              <div class="point-panel">
                <p class="point-summary">
                  現在の選択：{{ selectedChoiceText }}／自信度：{{ confidence }}
                </p>
                <p class="point-value">
                  {{ expectedPoint }}<span class="point-unit">pt</span>
                </p>
                <p class="point-caption">
                  この内容で送信すると獲得できる予定のポイント
                </p>
              </div>

              <p class="answer-note">
                ※ プレビューのため送信は行われません。
              </p>

              <button
                type="button"
                class="answer-submit"
                :disabled="selectedChoice === null"
                @click="submitted = true"
              >
                この内容で解答する
              </button>
            </section>

            <section v-else class="answer-card">
              <p class="eyebrow">
                After submit
              </p>
              <h2>解答を送信しました</h2>
              <p class="muted-copy">
                正解表示後の見た目です。
              </p>

              <div class="choice-list">
                <div
                  v-for="key in CHOICE_KEYS"
                  :key="key"
                  class="choice-item"
                  :class="{ 'is-selected': key === question.correctAnswer }"
                >
                  <span class="choice-key">{{ key }}</span>
                  <span class="choice-text">{{ choiceText(question, key) }}</span>
                  <span class="choice-check" aria-hidden="true">✓</span>
                </div>
              </div>

              <div class="point-panel">
                <p class="point-summary">
                  正解：{{ question.correctAnswer }}. {{ choiceText(question, question.correctAnswer) }}
                </p>
              </div>

              <p class="answer-note">
                {{ question.explanation ? `解説: ${question.explanation}` : '解説は登録されていません。' }}
              </p>

              <button type="button" class="answer-submit" @click="submitted = false">
                出題中の画面に戻る
              </button>
            </section>
          </main>
        </div>
      </div>
    </section>
  </div>
</template>
