<script setup lang="ts">
import AdminPortal from '~/admin/components/AdminPortal.vue'

// Single optional-param page: /admin and /admin/<view> share one route component.
// A static page key is required as well: Nuxt keys pages by interpolated path by
// default, which remounts AdminPortal on every screen switch — the session check
// re-runs, the login layout flashes in, and the appear animations replay.
definePageMeta({
  key: 'admin-portal',
  validate: (route) => {
    const view = route.params.view
    return view === undefined || ['login', 'logs', 'status', 'permissions', 'logout'].includes(String(view))
  },
})
useHead({
  title: '管理者ログイン',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <AdminPortal />
</template>
