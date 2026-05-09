<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon?: string
    trend?: 'up' | 'down' | 'stable'
  }>(),
  {
    icon: '',
    trend: undefined,
  },
)

const trendConfig: Record<string, { icon: string; color: string }> = {
  up: { icon: '↑', color: 'text-green-400' },
  down: { icon: '↓', color: 'text-red-400' },
  stable: { icon: '→', color: 'text-gray-400' },
}
</script>

<template>
  <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          v-if="icon"
          class="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-base flex-shrink-0"
        >
          {{ icon }}
        </div>
        <div>
          <div class="text-xl font-bold text-white">{{ value }}</div>
          <div class="text-xs text-gray-400">{{ label }}</div>
        </div>
      </div>
      <span
        v-if="trend"
        :class="['text-lg', trendConfig[trend!]!.color]"
      >
        {{ trendConfig[trend!]!.icon }}
      </span>
    </div>
  </div>
</template>
