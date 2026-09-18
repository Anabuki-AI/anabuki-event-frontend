<script setup lang="ts">
withDefaults(defineProps<{
  tag?: string
}>(), {
  tag: 'div',
})
</script>

<template>
  <component :is="tag" class="ui-skeleton" aria-hidden="true" />
</template>
