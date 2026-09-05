<script setup lang="ts">
import { CHOICE_KEYS, formatMultiplier } from '../constants'
import type { Question } from '../types'

defineProps<{
  question: Question
}>()
</script>

<template>
  <article class="question-row">
    <div class="question-row-head">
      <span class="question-id">Q{{ question.id }}</span>
      <p class="question-text">
        {{ question.questionText }}
      </p>
      <span
        class="correct-badge"
        :title="`正解: ${question.choices[question.correctAnswer]}`"
      >
        正解 {{ question.correctAnswer }}
      </span>
    </div>

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

    <div class="question-row-foot">
      <span class="multiplier-chip">自信度倍率 ×{{ formatMultiplier(question.confidenceMultiplier) }}</span>
      <div class="question-row-actions">
        <NuxtLink
          class="row-action-link"
          :to="`/admin/problems/${question.id}/edit`"
        >
          編集
        </NuxtLink>
        <NuxtLink
          class="row-action-link"
          :to="`/admin/problems/${question.id}/multiplier`"
        >
          倍率変更
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
