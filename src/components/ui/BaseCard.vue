<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hoverable?: boolean
    clickable?: boolean
  }>(),
  {
    padding: 'md',
    hoverable: false,
    clickable: false,
  },
)

const paddingClasses: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}
</script>

<template>
  <div
    :class="[
      'bg-gray-900 rounded-xl border border-gray-800 transition-all duration-200',
      paddingClasses[padding],
      hoverable ? 'hover:border-gray-700 hover:shadow-lg hover:-translate-y-0.5' : '',
      clickable ? 'cursor-pointer' : '',
    ]"
  >
    <slot />
  </div>
</template>
