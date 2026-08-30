<script setup lang="ts">
useSeoMeta({
  title: 'ホーム',
  description: 'Anabuki Eventのフロントエンド開発基盤です。',
})
</script>

<template>
  <main class="page-shell">
    <section class="hero-card">
      <p class="eyebrow">
        Anabuki Event
      </p>
      <h1>イベント体験を、ここから。</h1>
      <p class="hero-copy">
        Nuxt 4を土台に、機能単位で無理なく育てられるフロントエンド構成です。
      </p>
      <NuxtLink class="primary-link" to="/users/new">
        ユーザー登録を試す。
      </NuxtLink>
    </section>
  </main>
</template>
