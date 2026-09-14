<script setup lang="ts">
defineProps<{
  name: 'arrow' | 'lock' | 'check' | 'refresh' | 'logout' | 'clock' | 'info'
}>()

const paths = {
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M6 10h12a1 1 0 0 1 1 1v9H5v-9a1 1 0 0 1 1-1Zm6 4v2',
  check: 'm5 12 4 4L19 6',
  refresh:
    'M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 19.5 10M4.5 14a8 8 0 0 0 13.4 3.9',
  logout: 'M9 5H4v14h5m5-14 7 7-7 7m-6-7h13',
  clock: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  info: 'M12 11v6m0-10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
}
</script>

<template>
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>
