<script setup lang="ts">
import { computed } from 'vue'
import type { SocialRole, Mood } from '@/types/domain'

const props = withDefaults(
  defineProps<{
    name: string
    role: SocialRole
    mood?: Mood
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    mood: undefined,
    size: 'md',
  },
)

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name.charAt(0).toUpperCase()
})

const sizeClasses: Record<string, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const moodDotSize: Record<string, string> = {
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-4 h-4 border-2',
}

const roleColors: Record<SocialRole, string> = {
  bridge: 'bg-amber-600 text-amber-100',
  mentor: 'bg-blue-600 text-blue-100',
  anchor: 'bg-emerald-600 text-emerald-100',
  catalyst: 'bg-orange-600 text-orange-100',
  observer: 'bg-slate-600 text-slate-100',
  drain: 'bg-red-600 text-red-100',
  unknown: 'bg-gray-600 text-gray-100',
}

const moodColors: Record<Mood, string> = {
  happy: 'bg-green-400',
  anxious: 'bg-yellow-400',
  tired: 'bg-gray-400',
  energized: 'bg-cyan-400',
  sad: 'bg-blue-400',
  neutral: 'bg-gray-500',
  angry: 'bg-red-400',
  hopeful: 'bg-purple-400',
  lonely: 'bg-indigo-400',
  grateful: 'bg-pink-400',
}
</script>

<template>
  <div class="relative inline-flex flex-shrink-0">
    <div
      :class="[
        'rounded-full flex items-center justify-center font-semibold select-none',
        sizeClasses[size],
        roleColors[role],
      ]"
    >
      {{ initials }}
    </div>
    <span
      v-if="mood"
      :class="[
        'absolute bottom-0 right-0 rounded-full bg-gray-900',
        moodDotSize[size],
        moodColors[mood],
      ]"
    />
  </div>
</template>
