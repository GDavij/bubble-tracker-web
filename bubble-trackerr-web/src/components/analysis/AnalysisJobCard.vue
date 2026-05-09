<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisJob } from '@/types/domain'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{
  job: AnalysisJob
}>()

const emit = defineEmits<{
  view: [job: AnalysisJob]
  retry: [job: AnalysisJob]
}>()

const statusConfig: Record<string, { label: string; variant: string; spinning?: boolean }> = {
  completed: { label: 'Completed', variant: 'quality-nourishing' },
  processing: { label: 'Processing', variant: 'default', spinning: true },
  failed: { label: 'Failed', variant: 'quality-draining' },
  pending: { label: 'Pending', variant: 'default' },
}

const statusInfo = computed(() => (statusConfig[props.job.status] || statusConfig.pending)!)

const preview = computed(() => {
  const text = props.job.text
  return text.length > 120 ? text.slice(0, 120) + '...' : text
})

const peopleCount = computed(() => {
  return props.job.result?.people_extracted?.length ?? 0
})

const timeAgo = computed(() => {
  const date = new Date(props.job.created_at)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
})
</script>

<template>
  <div class="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
    <div class="flex items-start justify-between gap-3 mb-3">
      <p class="text-sm text-gray-300 leading-relaxed">{{ preview }}</p>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <svg
          v-if="statusInfo.spinning"
          class="w-3.5 h-3.5 animate-spin text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <BaseBadge :variant="statusInfo.variant" size="sm">
          {{ statusInfo.label }}
        </BaseBadge>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 text-xs text-gray-500">
        <span>{{ timeAgo }}</span>
        <span v-if="peopleCount > 0">{{ peopleCount }} people</span>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          v-if="job.status === 'completed'"
          variant="ghost"
          size="sm"
          @click="$emit('view', job)"
        >
          View
        </BaseButton>
        <BaseButton
          v-if="job.status === 'failed'"
          variant="ghost"
          size="sm"
          @click="$emit('retry', job)"
        >
          Retry
        </BaseButton>
      </div>
    </div>
  </div>
</template>
