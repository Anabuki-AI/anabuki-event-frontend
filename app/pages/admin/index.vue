<script setup lang="ts">
import AdminMenu from '~/features/admin/components/AdminMenu.vue'
import type { AdminMenuItem } from '~/features/admin/components/AdminMenu.vue'

useSeoMeta({
  title: '運営者メイン画面',
  description: '投票率確認・出題管理・問題管理へ移動できる運営者向けメイン画面です。',
})

const adminMenu: AdminMenuItem[] = [
  {
    to: '/admin/voting-rate',
    icon: '📊',
    label: '投票率ページ',
    description: '問題ごとの解答状況と選択肢ごとの投票率を確認できます。',
  },
  {
    to: '/admin/quiz-control',
    icon: '🎮',
    label: '出題管理',
    description: 'クイズの出題を開始・進行できます。',
  },
  {
    to: '/admin/problems',
    icon: '📝',
    label: '問題管理',
    description: '問題の追加・編集などを行えます。',
  },
]
</script>

<template>
  <main class="page-shell">
    <section class="admin-card">
      <NuxtLink class="back-link" to="/">
        ← ホームへ戻る
      </NuxtLink>
      <div>
        <p class="eyebrow">
          Admin
        </p>
        <h1>運営者メイン画面</h1>
        <p class="muted-copy">
          各管理機能へ移動して、クイズイベントの運営を行えます。
        </p>
      </div>

      <AdminMenu :items="adminMenu" />
    </section>
  </main>
</template>
