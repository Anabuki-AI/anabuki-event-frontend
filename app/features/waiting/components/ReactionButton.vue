<script setup lang="ts">
import type { ReactionOption } from '../types'

defineProps<{
  option: ReactionOption
  count: number
  isReacted?: boolean
}>()

const emit = defineEmits<{
  react: [emoji: string]
}>()
</script>

<template>
  <button
    type="button"
    class="reaction-button"
    :class="{ 'is-reacted': isReacted }"
    :aria-label="`${option.label}リアクションを送る`"
    @click="emit('react', option.emoji)"
  >
    <span class="reaction-emoji" aria-hidden="true">{{ option.emoji }}</span>
    <span>{{ option.label }}</span>
    <span v-if="count > 0" class="reaction-chip-count">{{ count }}</span>
  </button>
</template>
