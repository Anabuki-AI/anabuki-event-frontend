<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'ja' },
  titleTemplate: title => title ? `${title} | Anabuki Event` : 'Anabuki Event',
})
</script>

<template>
  <NuxtLoadingIndicator color="#1769c2" />
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
