<script setup lang="ts">
import { ref, useRoute } from '#imports'
import WaitingRoom from '~/features/waiting/components/WaitingRoom.vue'

useSeoMeta({
  title: '待機画面',
  description: 'Anabuki Eventのイベント待機画面です。',
})

const route = useRoute()

// ユーザー登録画面からクエリで受け取る(状態管理は後の工程で整理)
const userName = ref((() => {
  const name = route.query.userName
  return typeof name === 'string' && name.length > 0 ? name : 'ゲスト'
})())

// デザイン確認用の仮データ。API連携は後の工程で置き換える。
const participantCount = ref(12)
const reactions = ref<Record<string, number>>({})

function handleReact(emoji: string) {
  reactions.value = { ...reactions.value, [emoji]: (reactions.value[emoji] ?? 0) + 1 }
}
</script>

<template>
  <main class="page-shell">
    <WaitingRoom
      :user-name="userName"
      :participant-count="participantCount"
      :reactions="reactions"
      @react="handleReact"
    />
  </main>
</template>
