<script setup lang="ts">
import type { Mood } from '@/types/domain'

defineProps<{
  mood: Mood
}>()

const moodConfig: Record<Mood, { emoji: string; color: string; label: string }> = {
  happy: { emoji: '😊', color: 'bg-green-500', label: 'Happy' },
  anxious: { emoji: '😰', color: 'bg-yellow-500', label: 'Anxious' },
  tired: { emoji: '😴', color: 'bg-gray-500', label: 'Tired' },
  energized: { emoji: '⚡', color: 'bg-cyan-500', label: 'Energized' },
  sad: { emoji: '😢', color: 'bg-blue-500', label: 'Sad' },
  neutral: { emoji: '😐', color: 'bg-gray-500', label: 'Neutral' },
  angry: { emoji: '😠', color: 'bg-red-500', label: 'Angry' },
  hopeful: { emoji: '🌟', color: 'bg-purple-500', label: 'Hopeful' },
  lonely: { emoji: '😔', color: 'bg-indigo-500', label: 'Lonely' },
  grateful: { emoji: '🙏', color: 'bg-pink-500', label: 'Grateful' },
}
</script>

<template>
  <div class="inline-flex items-center gap-1.5">
    <span class="text-sm">{{ moodConfig[mood].emoji }}</span>
    <span :class="['w-2 h-2 rounded-full', moodConfig[mood].color]" />
    <span class="text-xs text-gray-400">{{ moodConfig[mood].label }}</span>
  </div>
</template>
