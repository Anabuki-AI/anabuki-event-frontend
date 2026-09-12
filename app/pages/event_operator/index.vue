<script setup lang="ts">
import { setupAdminDrawer } from '~/features/admin/components/AdminDrawer'

useSeoMeta({
  title: '運営者メイン画面',
  description: '投票率確認・出題管理・問題管理へ移動できる運営者向けメイン画面です。',
})

const {
  isDrawerOpen,
  closeDrawer,
  toggleDrawer,
  handleDrawerKeydown,
} = setupAdminDrawer()
</script>

<template>
  <main class="page-shell admin-shell">
    <!-- ハンバーガーメニュー(ドロワー)。各管理画面共通のナビ -->
    <button
      type="button"
      class="admin-drawer-toggle"
      aria-label="メニューを開く"
      :aria-expanded="isDrawerOpen"
      @click="toggleDrawer"
    >
      <span aria-hidden="true">☰</span>
    </button>

    <div
      v-if="isDrawerOpen"
      class="admin-drawer-backdrop"
      @click="closeDrawer"
    />
    <nav
      v-if="isDrawerOpen"
      class="admin-drawer"
      aria-label="管理機能メニュー"
      @keydown="handleDrawerKeydown"
    >
      <div class="admin-drawer-head">
        <p class="admin-drawer-title">メニュー</p>
        <button
          type="button"
          class="admin-drawer-close"
          aria-label="メニューを閉じる"
          @click="closeDrawer"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <NuxtLink class="admin-drawer-link" to="/event_operator" @click="closeDrawer">
        <span class="admin-drawer-icon" aria-hidden="true">🏠</span>
        運営者メイン
      </NuxtLink>
      <NuxtLink class="admin-drawer-link" to="/event_operator/voting-rate" @click="closeDrawer">
        <span class="admin-drawer-icon" aria-hidden="true">📊</span>
        投票率ページ
      </NuxtLink>
      <NuxtLink class="admin-drawer-link" to="/admin/quiz-control" @click="closeDrawer">
        <span class="admin-drawer-icon" aria-hidden="true">🎮</span>
        出題管理
      </NuxtLink>
      <NuxtLink class="admin-drawer-link" to="/admin/problems" @click="closeDrawer">
        <span class="admin-drawer-icon" aria-hidden="true">📝</span>
        問題管理
      </NuxtLink>
    </nav>

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
