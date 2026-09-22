<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { CHOICE_KEYS, PHASE_LABELS } from '~/features/quiz-control/types'
import { useProjectorQuiz } from '~/features/projector/use-projector-quiz'
import { useProjectorRanking } from '~/features/projector/use-projector-ranking'
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

// 大会終了かつ次の問題が無い(=最終結果)ときだけ、終了メッセージの代わりにランキングを表示する
const showRanking = computed(() => phase.value === 'FINISHED' && !question.value)
const { topTen: rankingTopTen, errorMessage: rankingErrorMessage } = useProjectorRanking(showRanking)

// スクロール禁止の固定レイアウト。内容がはみ出す間 --projector-scale を縮めて必ず1画面に収める。
const shell = ref<HTMLElement | null>(null)
// 画像+長文+長い解説のような最も詰め込まれるケースでも収まりきるよう、
// 通常の 0.3 よりわずかに低い下限にしている(文字が読めなくなるほどではない範囲で確認済み)。
const MIN_SCALE = 0.22
// ちょうど収まった(scrollHeight <= clientHeight になった)瞬間に止めると、正解文言などが
// カード下端ぎりぎりに張り付いて見える。ただし scrollHeight は「内容がボックスより小さい」
// ケースでは常に clientHeight に張り付く(≒ box未満には下がらない)ため、
// scrollHeight と clientHeight を比率で比較して「余裕を測る」ことはできない
// (縮小が一切不要なケースまで誤って縮み続けてしまう)。
// そのため、実際に縮小が必要だった場合に限り、収まった後でさらに数段階だけ
// 追加で縮めることで、下に呼吸できる余白を作る。
const FIT_MARGIN_STEPS = 1
async function fitToViewport() {
  await nextTick()
  const el = shell.value
  if (!el) return
  let scale = 1
  let shrunk = false
  el.style.setProperty('--projector-scale', String(scale))
  while (scale > MIN_SCALE && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) {
    scale = Math.round(scale * 0.95 * 1000) / 1000
    el.style.setProperty('--projector-scale', String(scale))
    shrunk = true
  }
  if (shrunk) {
    for (let i = 0; i < FIT_MARGIN_STEPS && scale > MIN_SCALE; i++) {
      scale = Math.round(scale * 0.95 * 1000) / 1000
      el.style.setProperty('--projector-scale', String(scale))
    }
  }
}
watch(state, () => void fitToViewport(), { deep: true })
// isAnswerVisible は state から派生する値だが、切り替わりタイミングで再フィットが漏れないよう明示的にも監視する。
// (正解・解説が追加表示された直後にクリップされたまま残るのを防ぐ)
watch(isAnswerVisible, () => void fitToViewport())
// ランキング取得完了時も再フィットする(取得中→表示のタイミングでクリップされたまま残るのを防ぐ)
watch(rankingTopTen, () => void fitToViewport())
onMounted(() => {
  void fitToViewport()
  window.addEventListener('resize', fitToViewport)
})
onUnmounted(() => window.removeEventListener('resize', fitToViewport))

// 「FINISHED かつ 問題なし」は showRanking が必ず true になるため、ここには来ない(最終結果はランキング表示に置き換え済み)。
const idleMessage = computed(() => {
  if (isLoading.value) return '読み込み中…'
  if (errorMessage.value && !state.value) return '接続を確認しています…'
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

    <section
      v-if="question"
      class="projector-card"
      :class="{ 'has-image': hasImage, 'is-revealed': isAnswerVisible }"
    >
      <p class="projector-question">
        {{ question.question_text }}
      </p>
      <img v-if="imageUrl" class="projector-image" :src="imageUrl" alt="" @load="fitToViewport">
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
    <section v-else-if="showRanking" class="projector-card projector-ranking">
      <p class="projector-ranking-title">
        最終結果
      </p>
      <p v-if="rankingTopTen.length === 0" class="projector-message projector-ranking-empty">
        {{ rankingErrorMessage ? 'ランキングを取得できませんでした' : 'ランキングを集計しています…' }}
      </p>
      <ol v-else class="projector-ranking-list">
        <li
          v-for="entry in rankingTopTen"
          :key="entry.participantId"
          class="projector-ranking-item"
          :class="{ 'is-top': entry.rank <= 3 }"
        >
          <span class="projector-ranking-rank">{{ entry.rank }}位</span>
          <span class="projector-ranking-name">{{ entry.displayName }}</span>
          <span class="projector-ranking-points">{{ entry.totalPoints }}点</span>
        </li>
      </ol>
    </section>
    <section v-else class="projector-card">
      <p class="projector-message">
        {{ idleMessage }}
      </p>
    </section>
    <FloatingReactions v-if="showReactions" :items="floaters" @remove="removeFloater" />
  </main>
</template>
