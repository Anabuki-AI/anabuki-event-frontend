<script setup lang="ts">
export interface AdminMenuItem {
  to: string
  icon: string
  label: string
  description: string
}

defineProps<{
  items: AdminMenuItem[]
}>()
</script>

<template>
  <nav class="admin-menu" aria-label="管理機能メニュー">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      class="admin-menu-item"
      :to="item.to"
    >
      <span class="admin-menu-icon" aria-hidden="true">{{ item.icon }}</span>
      <span class="admin-menu-body">
        <span class="admin-menu-label">{{ item.label }}</span>
        <span class="admin-menu-description">{{ item.description }}</span>
      </span>
      <span class="admin-menu-arrow" aria-hidden="true">→</span>
    </NuxtLink>
  </nav>
</template>
