<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
}>()

const clampedValue = computed(() => Math.max(0, Math.min(1, props.value)))
const percentage = computed(() => Math.round(clampedValue.value * 100))

const barColor = computed(() => {
  if (clampedValue.value > 0.7) return 'bg-green-500'
  if (clampedValue.value > 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
})
</script>

<template>
  <div class="flex items-center gap-3 w-full">
    <span class="text-xs text-gray-400 w-28 flex-shrink-0 truncate">{{ label }}</span>
    <div class="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        :class="['h-full rounded-full transition-all duration-300', barColor]"
        :style="{ width: `${percentage}%` }"
      />
    </div>
    <span class="text-xs text-gray-500 tabular-nums w-8 text-right">
      {{ (clampedValue).toFixed(2) }}
    </span>
  </div>
</template>
