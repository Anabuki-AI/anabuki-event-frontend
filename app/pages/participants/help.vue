<script setup lang="ts">
useSeoMeta({
  title: 'ヘルプ',
  description: 'Anabuki Eventのヘルプ画面です。',
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card waiting-card">
      <div class="waiting-header">
        <p class="eyebrow-main">
          ヘルプ
        </p>
      </div>

      <div class="help-screen-body">
        <ul class="help-screen-list">
          <li>この画面はイベントの待機画面です。</li>
          <li>参加人数は自動で更新されます。</li>
          <li>リアクションボタンで気持ちを伝えられます。</li>
          <li>クイズが開始されると、画面が自動的に切り替わります。</li>
        </ul>
      </div>

      <NuxtLink class="primary-link" to="/participants/waiting">
        待機画面へ戻る
      </NuxtLink>
    </section>
  </main>
</template>
