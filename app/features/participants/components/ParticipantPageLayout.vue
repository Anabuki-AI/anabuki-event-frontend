<script setup lang="ts">
defineProps<{
  eyebrow: string
}>()
</script>

<template>
  <section class="form-card quiz-page">
    <header class="quiz-header">
      <p class="quiz-header-title">クイズ大会</p>
      <p class="eyebrow">{{ eyebrow }}</p>
      <NuxtLink
        class="help-button"
        to="/participants/help"
        target="_blank"
        rel="noopener"
      >
        ヘルプ
      </NuxtLink>
    </header>
    <main class="page-shell">
      <slot />
    </main>
  </section>
</template>
