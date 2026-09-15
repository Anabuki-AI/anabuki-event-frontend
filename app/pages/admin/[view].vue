<script setup lang="ts">
import AdminPortal from '~/admin/components/AdminPortal.vue'

// Separate route params, not aliases: Vue Router treats aliases as the same
// location and suppresses navigation between them.
definePageMeta({
  validate: route => ['login', 'logs', 'status', 'permissions', 'logout'].includes(String(route.params.view)),
})
useHead({
  title: '管理者ログイン',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <AdminPortal />
</template>
