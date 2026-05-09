<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    showValue?: boolean
  }>(),
  {
    showValue: false,
  },
)

const clampedValue = computed(() => Math.max(0, Math.min(1, props.value)))
const percentage = computed(() => Math.round(clampedValue.value * 100))

const barColor = computed(() => {
  if (clampedValue.value > 0.6) return 'bg-green-500'
  if (clampedValue.value > 0.3) return 'bg-yellow-500'
  return 'bg-red-500'
})
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        :class="['h-full rounded-full transition-all duration-300', barColor]"
        :style="{ width: `${percentage}%` }"
      />
    </div>
    <span v-if="showValue" class="text-xs text-gray-400 tabular-nums w-8 text-right">
      {{ (clampedValue).toFixed(1) }}
    </span>
  </div>
</template>
