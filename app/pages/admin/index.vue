<script setup lang="ts">
import AdminPortal from '~/admin/components/AdminPortal.vue'

definePageMeta({ alias: ['/admin/login'] })
useHead({
  title: '管理者ログイン',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <AdminPortal />
</template>
