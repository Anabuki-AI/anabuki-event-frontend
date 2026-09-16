<script setup lang="ts">
import OperatorPortal from '~/operator/components/OperatorPortal.vue'

definePageMeta({ alias: ['/operator/login'] })
useHead({
  title: 'イベントオペレーターログイン',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <OperatorPortal />
</template>
