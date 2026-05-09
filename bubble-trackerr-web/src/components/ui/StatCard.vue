<script setup lang="ts">
defineProps<{
  icon?: string
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
        {{ icon }}
      </div>
      <div class="min-w-0">
        <div class="text-xl font-bold text-white truncate">{{ value }}</div>
        <div class="text-xs text-gray-400 truncate">{{ label }}</div>
      </div>
    </div>
  </div>
</template>
