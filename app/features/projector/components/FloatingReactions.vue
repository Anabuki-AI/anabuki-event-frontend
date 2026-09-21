<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { FLOAT_CONFIG } from '../floating-reactions'
import type { FloatingReaction } from '../types'

const props = defineProps<{ items: FloatingReaction[] }>()
const emit = defineEmits<{ remove: [key: number] }>()

// animationend が来ない環境(タブ非表示・reduced-motion等)でもDOMが残らないよう保険で消す。
const timers = new Map<number, ReturnType<typeof setTimeout>>()
function arm(item: FloatingReaction) {
  if (timers.has(item.key)) return
  timers.set(item.key, setTimeout(() => done(item.key), item.delay + item.duration + FLOAT_CONFIG.cleanupGraceMs))
}
// 上限超過・停止で親から消された要素の保険タイマーも掃除する。
watch(() => props.items, (items) => {
  const alive = new Set(items.map(item => item.key))
  for (const key of [...timers.keys()]) {
    if (!alive.has(key)) { clearTimeout(timers.get(key)); timers.delete(key) }
  }
  items.forEach(arm)
}, { immediate: true })
function done(key: number) {
  const t = timers.get(key)
  if (t) clearTimeout(t)
  timers.delete(key)
  emit('remove', key)
}
function styleOf(item: FloatingReaction) {
  return {
    '--rf-left': `${item.left}%`,
    '--rf-sway': `${item.sway}px`,
    '--rf-drift': `${item.drift}px`,
    '--rf-size': `${item.size}px`,
    '--rf-duration': `${item.duration}ms`,
    '--rf-delay': `${item.delay}ms`,
  }
}
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="reaction-float-layer" aria-hidden="true">
    <span
      v-for="item in items"
      :key="item.key"
      class="reaction-float"
      :style="styleOf(item)"
      @animationend.self="done(item.key)"
    >
      <span class="reaction-float-emoji">{{ item.emoji }}</span>
    </span>
  </div>
</template>
