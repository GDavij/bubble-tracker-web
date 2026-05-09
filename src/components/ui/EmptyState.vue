<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
  }>(),
  {
    icon: '📭',
    title: 'Nothing here',
    description: '',
  },
)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="text-5xl mb-4">{{ icon }}</div>
    <h3 class="text-lg font-semibold text-gray-300 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-gray-500 max-w-sm">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
