<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/event_operator', query: route.query, hash: route.hash }, { redirectCode: 302, replace: true })
</script>

<template>
  <p>問題管理画面へ移動しています…</p>
</template>
