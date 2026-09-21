<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useParticipantReactions } from '../composables/use-participant-reactions'
import { reactionOptions } from '~/features/waiting/components/ReactionButton'

const emit = defineEmits<{ unauthorized: [] }>()
const { lastReactedEmoji, handleReact } = useParticipantReactions(() => emit('unauthorized'))
const open = ref(false)
const keyboardActive = ref(false)
const toggle = ref<HTMLButtonElement>()

async function close() {
  open.value = false
  await nextTick()
  toggle.value?.focus()
}

function updateKeyboard() {
  const target = document.activeElement
  const editing = target instanceof HTMLElement
    && (target.matches('input, textarea, select') || target.isContentEditable)
  const viewport = window.visualViewport
  keyboardActive.value = editing || Boolean(viewport && window.innerHeight - viewport.height > 150)
  if (keyboardActive.value) open.value = false
}

onMounted(() => {
  updateKeyboard()
  document.addEventListener('focusin', updateKeyboard)
  document.addEventListener('focusout', updateKeyboard)
  window.visualViewport?.addEventListener('resize', updateKeyboard)
})
onUnmounted(() => {
  document.removeEventListener('focusin', updateKeyboard)
  document.removeEventListener('focusout', updateKeyboard)
  window.visualViewport?.removeEventListener('resize', updateKeyboard)
})
</script>

<template>
  <div v-show="!keyboardActive" class="reaction-space" :class="{ 'is-open': open }">
    <aside class="participant-reactions" aria-label="参加者スタンプ" @keydown.esc.stop.prevent="close">
      <div v-if="open" id="participant-reaction-options" class="stamp-options" role="group" aria-label="送るスタンプを選択">
        <button
          v-for="option in reactionOptions"
          :key="option.emoji"
          type="button"
          class="stamp-button"
          :class="{ 'is-reacted': lastReactedEmoji === option.emoji }"
          :aria-label="`${option.label}リアクションを送る`"
          @click="handleReact(option.emoji)"
        >
          <span aria-hidden="true">{{ option.emoji }}</span>
        </button>
      </div>
      <button
        ref="toggle"
        type="button"
        class="stamp-toggle"
        :aria-expanded="open"
        :aria-controls="open ? 'participant-reaction-options' : undefined"
        @click="open = !open"
      >
        {{ open ? 'スタンプを閉じる' : 'スタンプを送る' }}
      </button>
    </aside>
  </div>
</template>

<style scoped>
/* Reserve scroll space so even the last page action can clear the dock. */
.reaction-space { height: calc(68px + env(safe-area-inset-bottom, 0px)); }
.reaction-space.is-open { height: calc(184px + env(safe-area-inset-bottom, 0px)); }
.participant-reactions {
  position: fixed;
  z-index: 30;
  right: max(12px, env(safe-area-inset-right, 0px));
  bottom: max(12px, env(safe-area-inset-bottom, 0px));
  width: min(272px, calc(100vw - 24px));
  display: grid;
  justify-items: end;
  gap: 8px;
}
.stamp-toggle {
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid #1769c2;
  border-radius: 24px;
  background: #1769c2;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.stamp-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  width: 100%;
  padding: 8px;
  border: 1px solid #1769c2;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 16px #13223826;
}
.stamp-button {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: #edeffa;
  font-size: 28px;
  cursor: pointer;
}
.stamp-button span { display: inline-block; }
.stamp-button.is-reacted span { animation: stamp-bounce 500ms ease; }
.stamp-button:focus-visible, .stamp-toggle:focus-visible { outline: 3px solid #132238; outline-offset: 3px; }
@keyframes stamp-bounce { 50% { transform: translateY(-6px) scale(1.15); } }
@media (prefers-reduced-motion: reduce) { .stamp-button.is-reacted span { animation: none; } }
</style>
