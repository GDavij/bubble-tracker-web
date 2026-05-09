<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string
    height?: string
  }>(),
  {
    variant: 'text',
    width: '100%',
    height: '1rem',
  },
)

const variantClasses: Record<string, string> = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
}
</script>

<template>
  <div
    :class="['animate-pulse bg-gray-800', variantClasses[variant]]"
    :style="{ width, height }"
  />
</template>
