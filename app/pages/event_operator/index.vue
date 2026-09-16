<script setup lang="ts">
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'

useSeoMeta({
  title: '運営者メイン画面',
  description: '投票率確認・出題管理・問題管理へ移動できる運営者向けメイン画面です。',
})

const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()
</script>

<template>
  <main class="page-shell admin-shell">
    <!-- 常設サイドバー。各管理画面共通のナビ。ボタンを押すとメニュー部分を完全に隠す -->
    <aside
      class="admin-sidebar"
      :class="{ 'admin-sidebar--collapsed': !isSidebarExpanded }"
      aria-label="管理機能メニュー"
      @keydown="handleSidebarKeydown"
    >
      <div class="admin-sidebar-head">
        <button
          type="button"
          class="admin-sidebar-toggle"
          :aria-label="isSidebarExpanded ? 'メニューを隠す' : 'メニューを表示する'"
          :aria-expanded="isSidebarExpanded"
          @click="toggleSidebar"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <p v-if="isSidebarExpanded" class="admin-sidebar-title">メニュー</p>
      </div>
      <nav v-if="isSidebarExpanded" class="admin-sidebar-nav">
        <NuxtLink class="admin-sidebar-link" to="/event_operator">運営者メイン</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/voting-rate">投票率ページ</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/quiz-control">出題管理</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/management">問題管理</NuxtLink>
      </nav>
    </aside>

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
        <NuxtLink class="admin-menu-item" to="/event_operator/quiz-control">
          <span class="admin-menu-icon" aria-hidden="true">🎮</span>
          <span class="admin-menu-body">
            <span class="admin-menu-label">出題管理</span>
            <span class="admin-menu-description">クイズの出題を開始・進行できます。</span>
          </span>
          <span class="admin-menu-arrow" aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink class="admin-menu-item" to="/event_operator/management">
          <span class="admin-menu-icon" aria-hidden="true">📝</span>
          <span class="admin-menu-body">
            <span class="admin-menu-label">問題管理</span>
            <span class="admin-menu-description">登録済みの問題を確認、追加、編集、削除できます。</span>
          </span>
          <span class="admin-menu-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </nav>
    </section>
  </main>
</template>
