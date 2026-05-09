<script setup lang="ts">
import type { SocialRole } from '@/types/domain'
import BaseTooltip from '@/components/ui/BaseTooltip.vue'

withDefaults(
  defineProps<{
    role: SocialRole
    confidence?: number
  }>(),
  {
    confidence: undefined,
  },
)

const roleLabels: Record<SocialRole, string> = {
  bridge: 'Bridge',
  mentor: 'Mentor',
  anchor: 'Anchor',
  catalyst: 'Catalyst',
  observer: 'Observer',
  drain: 'Drain',
  unknown: 'Unknown',
}

const roleBadgeVariant: Record<SocialRole, string> = {
  bridge: 'role-bridge',
  mentor: 'role-mentor',
  anchor: 'role-anchor',
  catalyst: 'role-catalyst',
  observer: 'role-observer',
  drain: 'role-drain',
  unknown: 'role-unknown',
}
</script>

<template>
  <BaseTooltip
    v-if="confidence !== undefined"
    :text="`${roleLabels[role]} (${Math.round(confidence * 100)}% confidence)`"
  >
    <span
      :class="[
        'inline-flex items-center gap-1.5 rounded-full border font-medium px-2.5 py-1 text-xs',
        {
          'bg-amber-500/20 text-amber-400 border-amber-500/30': role === 'bridge',
          'bg-blue-500/20 text-blue-400 border-blue-500/30': role === 'mentor',
          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30': role === 'anchor',
          'bg-orange-500/20 text-orange-400 border-orange-500/30': role === 'catalyst',
          'bg-slate-500/20 text-slate-400 border-slate-500/30': role === 'observer',
          'bg-red-500/20 text-red-400 border-red-500/30': role === 'drain',
          'bg-gray-500/20 text-gray-400 border-gray-500/30': role === 'unknown',
        },
      ]"
    >
      {{ roleLabels[role] }}
      <span class="opacity-70">{{ Math.round(confidence * 100) }}%</span>
    </span>
  </BaseTooltip>
  <span
    v-else
    :class="[
      'inline-flex items-center rounded-full border font-medium px-2.5 py-1 text-xs',
      {
        'bg-amber-500/20 text-amber-400 border-amber-500/30': role === 'bridge',
        'bg-blue-500/20 text-blue-400 border-blue-500/30': role === 'mentor',
        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30': role === 'anchor',
        'bg-orange-500/20 text-orange-400 border-orange-500/30': role === 'catalyst',
        'bg-slate-500/20 text-slate-400 border-slate-500/30': role === 'observer',
        'bg-red-500/20 text-red-400 border-red-500/30': role === 'drain',
        'bg-gray-500/20 text-gray-400 border-gray-500/30': role === 'unknown',
      },
    ]"
  >
    {{ roleLabels[role] }}
  </span>
</template>
