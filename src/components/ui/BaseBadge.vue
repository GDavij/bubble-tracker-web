<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: string
    size?: 'sm' | 'md'
  }>(),
  {
    variant: 'default',
    size: 'md',
  },
)

const variantClasses: Record<string, string> = {
  'role-bridge': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'role-mentor': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'role-anchor': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'role-catalyst': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'role-observer': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'role-drain': 'bg-red-500/20 text-red-400 border-red-500/30',
  'role-unknown': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'quality-nourishing': 'bg-green-500/20 text-green-400 border-green-500/30',
  'quality-neutral': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'quality-draining': 'bg-red-500/20 text-red-400 border-red-500/30',
  'quality-conflicted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'quality-unknown': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full border font-medium',
      variantClasses[variant] || variantClasses.default,
      sizeClasses[size],
    ]"
  >
    <slot />
  </span>
</template>
