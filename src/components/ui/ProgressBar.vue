<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
    label?: string
    showValue?: boolean
  }>(),
  {
    max: 100,
    size: 'md',
    color: 'blue',
    label: '',
    showValue: false,
  },
)

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

const sizeClasses: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}
</script>

<template>
  <div class="w-full">
    <div v-if="label || showValue" class="flex justify-between items-center mb-1">
      <span v-if="label" class="text-xs text-gray-400">{{ label }}</span>
      <span v-if="showValue" class="text-xs font-medium text-gray-300">
        {{ Math.round((value / max) * 100) }}%
      </span>
    </div>
    <div :class="['w-full bg-gray-800 rounded-full overflow-hidden', sizeClasses[size]]">
      <div
        :class="['h-full rounded-full transition-all duration-500 ease-out', colorClasses[color]]"
        :style="{ width: `${Math.min(100, Math.round((value / max) * 100))}%` }"
      />
    </div>
  </div>
</template>
