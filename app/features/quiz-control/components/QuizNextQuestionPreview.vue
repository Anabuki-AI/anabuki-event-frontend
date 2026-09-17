<script setup lang="ts">
import { computed } from 'vue'
import { CHOICE_KEYS } from '../types'
import type { OperatorNextQuestion } from '../types'
import { resolveQuestionImageUrl } from '~/features/problems/api/client'

const props = defineProps<{
  nextQuestion: OperatorNextQuestion | null
}>()

const imageUrl = computed(() => resolveQuestionImageUrl(props.nextQuestion?.image_url ?? null))
</script>

<template>
  <section class="quiz-next-preview" aria-label="次の問題プレビュー">
    <p class="quiz-next-preview-title">
      次の問題
    </p>

    <article v-if="nextQuestion" class="quiz-next-preview-card">
      <div class="quiz-next-preview-head">
        <span class="quiz-next-preview-id">Q{{ nextQuestion.position }}</span>
      </div>

      <p class="quiz-next-preview-text">
        {{ nextQuestion.question_text }}
      </p>

      <img
        v-if="imageUrl"
        class="quiz-next-preview-image"
        :src="imageUrl"
        alt=""
      >

      <ul class="quiz-next-preview-choices">
        <li v-for="key in CHOICE_KEYS" :key="key">
          <span class="quiz-next-preview-choice-key">{{ key }}</span>
          {{ nextQuestion.choices[key] }}
        </li>
      </ul>
    </article>

    <p v-else class="quiz-next-preview-empty">
      次の問題はありません。
    </p>
  </section>
</template>
