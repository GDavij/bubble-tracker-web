<script setup lang="ts">
import { ref, computed } from 'vue'
import type { NodeMetrics } from '@/types/graph'

const props = defineProps<{
  metrics: NodeMetrics
}>()

interface MetricGroup {
  category: string
  items: Array<{ key: string; label: string; value: number }>
}

const metricGroups = computed<MetricGroup[]>(() => {
  const groups: MetricGroup[] = [
    {
      category: 'Centrality',
      items: [
        { key: 'degree', label: 'Degree', value: props.metrics.centrality.degree },
        { key: 'betweenness', label: 'Betweenness', value: props.metrics.centrality.betweenness },
        { key: 'closeness', label: 'Closeness', value: props.metrics.centrality.closeness },
        { key: 'eigenvector', label: 'Eigenvector', value: props.metrics.centrality.eigenvector },
        { key: 'pagerank', label: 'PageRank', value: props.metrics.centrality.pagerank },
        { key: 'clustering', label: 'Clustering', value: props.metrics.centrality.clustering_coef },
      ],
    },
    {
      category: 'Community',
      items: [
        { key: 'embeddedness', label: 'Embeddedness', value: props.metrics.community.embeddedness },
        { key: 'bridge', label: 'Bridge Score', value: props.metrics.community.bridge },
      ],
    },
    {
      category: 'Relational Health',
      items: [
        { key: 'overall', label: 'Overall', value: props.metrics.relational_health.overall },
        { key: 'reciprocity', label: 'Reciprocity', value: props.metrics.relational_health.reciprocity },
        { key: 'communication', label: 'Communication', value: props.metrics.relational_health.communication },
        { key: 'trust', label: 'Trust', value: props.metrics.relational_health.trust },
        { key: 'support', label: 'Support', value: props.metrics.relational_health.support },
        { key: 'compatibility', label: 'Compatibility', value: props.metrics.relational_health.compatibility },
        { key: 'growth', label: 'Growth', value: props.metrics.relational_health.growth },
        { key: 'resilience', label: 'Resilience', value: props.metrics.relational_health.resilience },
      ],
    },
    {
      category: 'Social Capital',
      items: [
        { key: 'total', label: 'Total', value: props.metrics.social_capital.total },
        { key: 'bonding', label: 'Bonding', value: props.metrics.social_capital.bonding },
        { key: 'bridging', label: 'Bridging', value: props.metrics.social_capital.bridging },
      ],
    },
    {
      category: 'Humanist',
      items: [
        { key: 'agency', label: 'Agency', value: props.metrics.humanist_score.agency },
        { key: 'empathic', label: 'Empathic', value: props.metrics.humanist_score.empathic },
      ],
    },
    {
      category: 'Social Exchange',
      items: [
        { key: 'satisfaction', label: 'Satisfaction', value: props.metrics.social_exchange.satisfaction },
        { key: 'investment', label: 'Investment', value: props.metrics.social_exchange.investment },
        { key: 'comparison', label: 'Comparison Level', value: props.metrics.social_exchange.comparison_level },
      ],
    },
    {
      category: 'Other',
      items: [
        { key: 'degree_count', label: 'Degree Count', value: props.metrics.degree },
        { key: 'frequency', label: 'Interaction Frequency', value: props.metrics.interaction_frequency },
        { key: 'valence', label: 'Emotional Valence', value: props.metrics.emotional_valence },
      ],
    },
  ]
  return groups
})

const expandedGroups = ref<Set<string>>(new Set(['Centrality']))

function toggleGroup(category: string) {
  if (expandedGroups.value.has(category)) {
    expandedGroups.value.delete(category)
  } else {
    expandedGroups.value.add(category)
  }
}

function formatValue(value: number): string {
  if (value >= 0 && value <= 1) return value.toFixed(3)
  return value.toFixed(1)
}

function barColor(value: number): string {
  if (value >= 0 && value <= 1) {
    if (value > 0.7) return 'bg-green-500'
    if (value > 0.4) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  return 'bg-blue-500'
}

function barWidth(value: number): string {
  if (value >= 0 && value <= 1) return `${Math.round(value * 100)}%`
  return `${Math.min(100, Math.round(value))}%`
}
</script>

<template>
  <div class="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
    <div
      v-for="group in metricGroups"
      :key="group.category"
    >
      <button
        class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800/50 transition-colors"
        @click="toggleGroup(group.category)"
      >
        <span>{{ group.category }}</span>
        <svg
          :class="['w-4 h-4 text-gray-400 transition-transform', expandedGroups.has(group.category) ? 'rotate-180' : '']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div v-if="expandedGroups.has(group.category)" class="px-4 pb-3 space-y-2.5">
        <div v-for="item in group.items" :key="item.key" class="flex items-center gap-3">
          <span class="text-xs text-gray-400 w-36 flex-shrink-0 truncate">{{ item.label }}</span>
          <div class="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-300', barColor(item.value)]"
              :style="{ width: barWidth(item.value) }"
            />
          </div>
          <span class="text-xs text-gray-500 tabular-nums w-14 text-right">{{ formatValue(item.value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
