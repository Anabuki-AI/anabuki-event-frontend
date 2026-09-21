<script setup lang="ts">
import { computed } from 'vue'
import ParticipantReactionPanel from './ParticipantReactionPanel.vue'
import { useReactionSession } from '../composables/use-reaction-session'

// Router state updates immediately; Nuxt's useRoute can lag until page rendering.
const router = useRouter()
const path = computed(() => router.currentRoute.value.path)
const { canReact, invalidate } = useReactionSession(path)
</script>

<template>
  <ParticipantReactionPanel v-if="canReact" :key="path" @unauthorized="invalidate" />
</template>
