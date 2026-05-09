<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MemoryResult } from '@/types/domain'

const props = defineProps<{
  result: MemoryResult
  query?: string
}>()

const expanded = ref(false)

const scoreColor = computed(() => {
  if (props.result.score >= 0.8) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (props.result.score >= 0.5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
})

const highlightedContent = computed(() => {
  if (!props.query || !props.result.content) return props.result.content
  const escaped = props.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return props.result.content.replace(
    regex,
    '<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">$1</mark>',
  )
})

const formattedDate = computed(() => {
  if (!props.result.metadata?.timestamp) return ''
  const date = new Date(props.result.metadata.timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>

<template>
  <div class="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
    <div class="flex items-start justify-between gap-3 mb-2">
      <div class="flex items-center gap-2">
        <span
          :class="[
            'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium',
            scoreColor,
          ]"
        >
          {{ Math.round(result.score * 100) }}%
        </span>
        <span v-if="formattedDate" class="text-xs text-gray-500">{{ formattedDate }}</span>
      </div>
    </div>

    <p
      class="text-sm text-gray-300 leading-relaxed mb-3"
      v-html="highlightedContent"
    />

    <div v-if="result.metadata?.people?.length" class="flex flex-wrap gap-1.5 mb-3">
      <span
        v-for="person in result.metadata.people"
        :key="person"
        class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20"
      >
        {{ person }}
      </span>
    </div>

    <button
      v-if="!expanded"
      class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      @click="expanded = true"
    >
      Show details
    </button>
    <div v-else class="mt-2 space-y-2 text-xs text-gray-500">
      <div v-if="result.metadata.interaction_id">
        <span class="text-gray-600">Interaction:</span> {{ result.metadata.interaction_id }}
      </div>
      <button
        class="text-gray-500 hover:text-gray-300 transition-colors"
        @click="expanded = false"
      >
        Hide details
      </button>
    </div>
  </div>
</template>
