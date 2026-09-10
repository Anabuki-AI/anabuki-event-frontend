<script setup lang="ts">
useSeoMeta({
  title: '運営者メイン画面',
  description: '投票率確認・出題管理・問題管理へ移動できる運営者向けメイン画面です。',
})
</script>

<template>
  <main class="page-shell admin-shell">
    <section class="admin-card">
      <div>
        <p class="eyebrow">
          Admin
        </p>
        <h1>運営者メイン画面</h1>
        <p class="muted-copy">
          各管理機能へ移動して、クイズイベントの運営を行えます。
        </p>
      </div>

      <nav class="admin-menu" aria-label="管理機能メニュー">
        <NuxtLink class="admin-menu-item" to="/event_operator/voting-rate">
          <span class="admin-menu-icon" aria-hidden="true">📊</span>
          <span class="admin-menu-body">
            <span class="admin-menu-label">投票率ページ</span>
            <span class="admin-menu-description">問題ごとの解答状況と選択肢ごとの投票率を確認できます。</span>
          </span>
          <span class="admin-menu-arrow" aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink class="admin-menu-item" to="/admin/quiz-control">
          <span class="admin-menu-icon" aria-hidden="true">🎮</span>
          <span class="admin-menu-body">
            <span class="admin-menu-label">出題管理</span>
            <span class="admin-menu-description">クイズの出題を開始・進行できます。</span>
          </span>
          <span class="admin-menu-arrow" aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink class="admin-menu-item" to="/admin/problems">
          <span class="admin-menu-icon" aria-hidden="true">📝</span>
          <span class="admin-menu-body">
            <span class="admin-menu-label">問題管理</span>
            <span class="admin-menu-description">問題の追加・編集などを行えます。</span>
          </span>
          <span class="admin-menu-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </nav>
    </section>
  </main>
</template>
