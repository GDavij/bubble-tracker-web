<script setup lang="ts">
import type { Quality } from '@/types/domain'

withDefaults(
  defineProps<{
    quality: Quality
    strength?: number
  }>(),
  {
    strength: undefined,
  },
)

const qualityConfig: Record<Quality, { color: string; label: string }> = {
  nourishing: { color: 'bg-green-500', label: 'Nourishing' },
  neutral: { color: 'bg-gray-400', label: 'Neutral' },
  draining: { color: 'bg-red-500', label: 'Draining' },
  conflicted: { color: 'bg-yellow-500', label: 'Conflicted' },
  unknown: { color: 'bg-gray-500', label: 'Unknown' },
}
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <span :class="['w-2 h-2 rounded-full flex-shrink-0', qualityConfig[quality].color]" />
    <span class="text-xs font-medium text-gray-300">{{ qualityConfig[quality].label }}</span>
    <div
      v-if="strength !== undefined"
      class="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden"
    >
      <div
        :class="['h-full rounded-full', qualityConfig[quality].color]"
        :style="{ width: `${Math.round(Math.max(0, Math.min(1, strength)) * 100)}%` }"
      />
    </div>
  </div>
</template>
