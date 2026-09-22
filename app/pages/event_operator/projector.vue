<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { CHOICE_KEYS, PHASE_LABELS } from '~/features/quiz-control/types'
import { useProjectorQuiz } from '~/features/projector/use-projector-quiz'
import { useFloatingReactions } from '~/features/projector/use-floating-reactions'
import FloatingReactions from '~/features/projector/components/FloatingReactions.vue'
import { resolveApiImageUrl } from '~/lib/api/image'
import '~/assets/css/projector.css'

useSeoMeta({
  title: '大画面表示',
  description: 'プロジェクター等に映すための、現在の問題と正解発表を表示する開催者向けページです。',
})

const { state, phase, isLoading, errorMessage, isAnswerVisible } = useProjectorQuiz()
// 開始前(waiting)は current が残っていても問題を出さない(先出し防止)
const question = computed(() => (phase.value === 'IDLE' ? null : state.value?.current ?? null))
const imageUrl = computed(() => resolveApiImageUrl(question.value?.image_url ?? null))
const hasImage = computed(() => Boolean(imageUrl.value))

// 待機中(IDLE)・問題表示中・正解表示中は、参加者のリアクションを画面下から浮かべる(終了後は表示しない)
const showReactions = computed(() => !!phase.value && phase.value !== 'FINISHED')
const { floaters, remove: removeFloater } = useFloatingReactions(showReactions)

// スクロール禁止の固定レイアウト。内容がはみ出す間 --projector-scale を縮めて必ず1画面に収める。
const shell = ref<HTMLElement | null>(null)
const MIN_SCALE = 0.3
async function fitToViewport() {
  await nextTick()
  const el = shell.value
  if (!el) return
  let scale = 1
  el.style.setProperty('--projector-scale', String(scale))
  while (scale > MIN_SCALE && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) {
    scale = Math.round(scale * 0.95 * 1000) / 1000
    el.style.setProperty('--projector-scale', String(scale))
  }
}
watch(state, () => void fitToViewport(), { deep: true })
// isAnswerVisible は state から派生する値だが、切り替わりタイミングで再フィットが漏れないよう明示的にも監視する。
// (正解・解説が追加表示された直後にクリップされたまま残るのを防ぐ)
watch(isAnswerVisible, () => void fitToViewport())
onMounted(() => {
  void fitToViewport()
  window.addEventListener('resize', fitToViewport)
})
onUnmounted(() => window.removeEventListener('resize', fitToViewport))

const idleMessage = computed(() => {
  if (isLoading.value) return '読み込み中…'
  if (errorMessage.value && !state.value) return '接続を確認しています…'
  if (phase.value === 'FINISHED') return 'クイズ大会は終了しました'
  return 'まもなく問題を表示します'
})
</script>

<template>
  <main ref="shell" class="projector-shell" :class="{ 'is-message': !question }">
    <header class="projector-head">
      <span v-if="question" class="projector-number">Q{{ question.position }}</span>
      <span v-if="phase && question" class="projector-status">{{ PHASE_LABELS[phase] }}</span>
      <span v-if="errorMessage" class="projector-error" role="alert">通信エラー：再試行中です</span>
    </header>

    <section v-if="question" class="projector-card">
      <p class="projector-question">
        {{ question.question_text }}
      </p>
      <img v-if="imageUrl" class="projector-image" :src="imageUrl" alt="" @load="fitToViewport">
      <ul class="projector-choices" :class="{ 'has-image': hasImage }">
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
    <FloatingReactions v-if="showReactions" :items="floaters" @remove="removeFloater" />
  </main>
</template>
