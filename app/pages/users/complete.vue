<script setup lang="ts">
import { computed, useRoute } from '#imports'

useSeoMeta({
  title: 'ユーザー登録完了',
  description: 'Anabuki Eventのユーザー登録完了画面です。',
})

const route = useRoute()

// 登録画面からクエリで受け取る(状態管理は後の工程で整理)
const userName = computed(() => {
  const name = route.query.userName
  return typeof name === 'string' && name.length > 0 ? name : 'ゲスト'
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card">
      <div>
        <p class="eyebrow">
          Registration complete
        </p>
        <h1>ユーザー登録完了</h1>
        <p class="muted-copy">
          {{ userName }} さんの登録が完了しました。
        </p>
      </div>
      <p class="status-message success" role="status">
        ご登録ありがとうございます。
      </p>
      <NuxtLink class="primary-link" to="/">
        ホームへ戻る
      </NuxtLink>
    </section>
  </main>
</template>
