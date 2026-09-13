<script setup lang="ts">
import { computed, useRoute } from '#imports'

useSeoMeta({
  title: 'ニックネーム編集',
  description: 'Anabuki Eventのニックネーム編集ページです。',
})

const route = useRoute()

// 待機画面からクエリで受け取る。編集フォーム本体は後続のissueで実装する。
const currentName = computed(() => {
  const name = route.query.userName
  return typeof name === 'string' && name.length > 0 ? name : 'ゲスト'
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card">
      <div class="page-header-actions">
        <NuxtLink
          class="back-link"
          :to="{ path: '/users/waiting', query: { userName: currentName } }"
        >
          ← 待機画面へ戻る
        </NuxtLink>

        <NuxtLink
          class="help-button"
          to="/help#nickname-edit"
        >
          ヘルプ
        </NuxtLink>
      </div>
      <div>
        <p class="eyebrow">
          Edit nickname
        </p>
        <h1>ニックネーム編集</h1>
        <p class="muted-copy">
          現在のニックネーム: {{ currentName }} さん
        </p>
      </div>
      <p class="status-message success" role="status">
        このページは準備中です。編集フォームは今後実装されます。
      </p>
    </section>
  </main>
</template>
