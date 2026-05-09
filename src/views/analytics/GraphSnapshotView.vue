<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGraphStore } from '@/stores/graph'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseTooltip from '@/components/ui/BaseTooltip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const graphStore = useGraphStore()
const isLoading = ref(true)
const loadError = ref<string | null>(null)

const snapshot = computed(() => graphStore.snapshot)

interface MetricCard {
  icon: string
  label: string
  value: string | number
  description: string
}

const metricCards = computed<MetricCard[]>(() => {
  const s = snapshot.value
  return [
    {
      icon: '👥',
      label: 'Total People',
      value: s?.total_people ?? '—',
      description: 'Number of unique people in your social graph',
    },
    {
      icon: '🔗',
      label: 'Total Relationships',
      value: s?.total_relationships ?? '—',
      description: 'Number of connections between people in the graph',
    },
    {
      icon: '🔄',
      label: 'Avg Reciprocity',
      value: s?.avg_reciprocity != null ? s.avg_reciprocity.toFixed(4) : '—',
      description: 'Average reciprocity index across all relationships (0–1). Higher values mean more balanced connections.',
    },
    {
      icon: '🌉',
      label: 'Bridge Count',
      value: s?.bridge_count ?? '—',
      description: 'Number of people who connect different social groups or communities',
    },
    {
      icon: '📡',
      label: 'Network Density',
      value: s?.network_density != null ? `${(s.network_density * 100).toFixed(1)}%` : '—',
      description: 'Proportion of possible relationships that actually exist. Higher density means a more tightly-knit network.',
    },
    {
      icon: '🔮',
      label: 'Avg Clustering',
      value: s?.avg_clustering != null ? `${(s.avg_clustering * 100).toFixed(1)}%` : '—',
      description: 'How closely grouped your network is. Higher values indicate tight-knit clusters.',
    },
    {
      icon: '🏘️',
      label: 'Community Count',
      value: s?.community_count ?? '—',
      description: 'Number of distinct communities or subgroups detected in the network',
    },
  ]
})

const strongestConnectionLabel = computed(() => {
  if (!snapshot.value?.strongest_connection) return null
  return snapshot.value.strongest_connection
})

async function loadData() {
  isLoading.value = true
  loadError.value = null
  try {
    await graphStore.fetchSnapshot()
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load graph snapshot'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white">Graph Snapshot</h1>
    </div>

    <!-- Loading state -->
    <template v-if="isLoading">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div class="flex items-center gap-4">
            <BaseSkeleton variant="circular" width="3rem" height="3rem" />
            <div class="space-y-2 flex-1">
              <BaseSkeleton variant="text" width="40%" height="0.75rem" />
              <BaseSkeleton variant="text" width="80%" height="2rem" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Error state -->
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadData" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="!snapshot"
      icon="📸"
      title="No snapshot data"
      description="Graph snapshot data will appear once your social graph has been built."
    />

    <!-- Metric cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <BaseTooltip
        v-for="metric in metricCards"
        :key="metric.label"
        :text="metric.description"
        position="top"
        :delay="300"
      >
        <BaseCard padding="lg" hoverable>
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0"
            >
              {{ metric.icon }}
            </div>
            <div class="min-w-0">
              <div class="text-3xl font-bold text-white truncate">{{ metric.value }}</div>
              <div class="text-sm text-gray-400 mt-1">{{ metric.label }}</div>
            </div>
          </div>
        </BaseCard>
      </BaseTooltip>
    </div>

    <!-- Strongest connection highlight -->
    <BaseCard v-if="strongestConnectionLabel" padding="md">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg">
          ⭐
        </div>
        <div>
          <div class="text-xs text-gray-500">Strongest Connection</div>
          <div class="text-base font-semibold text-white">{{ strongestConnectionLabel }}</div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
