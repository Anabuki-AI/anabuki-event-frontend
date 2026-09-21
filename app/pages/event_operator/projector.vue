<script setup lang="ts">
import { computed } from 'vue'
import { CHOICE_KEYS, PHASE_LABELS } from '~/features/quiz-control/types'
import { useProjectorQuiz } from '~/features/projector/use-projector-quiz'
import { resolveApiImageUrl } from '~/lib/api/image'
import '~/assets/css/projector.css'

useSeoMeta({
  title: '大画面表示',
  description: 'プロジェクター等に映すための、現在の問題と正解発表を表示する開催者向けページです。',
})

const { state, phase, isLoading, errorMessage, isAnswerVisible } = useProjectorQuiz()
const question = computed(() => state.value?.current ?? null)
const imageUrl = computed(() => resolveApiImageUrl(question.value?.image_url ?? null))
const idleMessage = computed(() => {
  if (isLoading.value) return '読み込み中…'
  if (phase.value === 'FINISHED') return 'クイズ大会は終了しました'
  return 'まもなく問題を表示します'
})
</script>

<template>
  <main class="projector-shell">
    <header class="projector-head">
      <span v-if="question" class="projector-number">Q{{ question.position }}</span>
      <span v-if="phase && question" class="projector-status">{{ PHASE_LABELS[phase] }}</span>
      <span v-if="errorMessage" class="projector-error" role="alert">通信エラー：再試行中です</span>
    </header>

    <section v-if="question" class="projector-card">
      <p class="projector-question">
        {{ question.question_text }}
      </p>
      <img v-if="imageUrl" class="projector-image" :src="imageUrl" alt="">
      <ul class="projector-choices">
        <li
          v-for="key in CHOICE_KEYS"
          :key="key"
          class="projector-choice"
          :class="{
            'is-correct': isAnswerVisible && key === question.correct_answer,
            'is-dimmed': isAnswerVisible && key !== question.correct_answer,
          }"
        >
          <span class="projector-choice-key">{{ key }}</span>
          <span>{{ question.choices[key] }}</span>
        </li>
      </ul>
      <template v-if="isAnswerVisible">
        <p class="projector-answer" role="status">
          正解：{{ question.correct_answer }}：{{ question.choices[question.correct_answer] }}
        </p>
        <p v-if="question.explanation" class="projector-explanation">
          <span class="projector-explanation-label">解説</span>{{ question.explanation }}
        </p>
      </template>
    </section>
    <section v-else class="projector-card">
      <p class="projector-message">
        {{ idleMessage }}
      </p>
    </section>
  </main>
</template>
