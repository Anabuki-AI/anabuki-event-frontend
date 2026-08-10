<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'ja' },
  titleTemplate: title => title ? `${title} | Anabuki Event` : 'Anabuki Event',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
