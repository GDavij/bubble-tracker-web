<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graph'
import { analysisService } from '@/services/analysis.service'
import type { AggregatedProfile } from '@/types/graph'
import type { SocialRole } from '@/types/domain'
import BaseCard from '@/components/ui/BaseCard.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import RoleBadge from '@/components/people/RoleBadge.vue'
import PersonAvatar from '@/components/people/PersonAvatar.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

type SortKey = 'rank' | 'percentile' | 'trend' | 'stability'

const router = useRouter()
const graphStore = useGraphStore()

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const profiles = ref<Record<string, AggregatedProfile>>({})
const sortKey = ref<SortKey>('rank')
const sortAscending = ref(true)

function navigateToPerson(personId: string) {
  router.push(`/people/${personId}`)
}

// Trend display helpers
const trendLabels: Record<string, string> = {
  improving: 'Strengthening',
  stable: 'Stable',
  declining: 'Declining',
  volatile: 'Volatile',
}

function trendIcon(trend: string): string {
  switch (trend) {
    case 'improving': return '📈'
    case 'stable': return '📊'
    case 'declining': return '📉'
    case 'volatile': return '⚡'
    default: return '📊'
  }
}

function trendColor(trend: string): string {
  switch (trend) {
    case 'improving': return 'text-emerald-400'
    case 'stable': return 'text-blue-400'
    case 'declining': return 'text-red-400'
    case 'volatile': return 'text-amber-400'
    default: return 'text-gray-400'
  }
}

// Build enriched profile list combining person data with profile data
const profileList = computed(() => {
  const nodeMap = new Map(graphStore.nodes.map((n) => [n.id, n]))
  return Object.entries(profiles.value)
    .filter(([, profile]) => profile.rank > 0)
    .map(([personId, profile]) => {
      const person = nodeMap.get(personId)
      return {
        personId,
        displayName: person?.display_name ?? personId,
        role: (person?.social_role ?? 'unknown') as SocialRole,
        rank: profile.rank,
        percentile: profile.percentile,
        trend: profile.trend,
        stability: profile.stability,
        summary: profile.summary,
      }
    })
})

// Sorting
const sortedProfiles = computed(() => {
  const sorted = [...profileList.value]
  sorted.sort((a, b) => {
    let cmp = 0
    switch (sortKey.value) {
      case 'rank':
        cmp = a.rank - b.rank
        break
      case 'percentile':
        cmp = a.percentile - b.percentile
        break
      case 'trend': {
        const order: Record<string, number> = { improving: 0, stable: 1, volatile: 2, declining: 3 }
        cmp = (order[a.trend] ?? 99) - (order[b.trend] ?? 99)
        break
      }
      case 'stability':
        cmp = a.stability - b.stability
        break
    }
    return sortAscending.value ? cmp : -cmp
  })
  return sorted
})

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAscending.value = !sortAscending.value
  } else {
    sortKey.value = key
    sortAscending.value = key === 'rank' || key === 'stability'
  }
}

function rankDisplay(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function percentileColor(percentile: number): 'green' | 'blue' | 'amber' | 'red' {
  if (percentile >= 75) return 'green'
  if (percentile >= 50) return 'blue'
  if (percentile >= 25) return 'amber'
  return 'red'
}

async function loadData() {
  isLoading.value = true
  loadError.value = null
  try {
    await graphStore.fetchGraph()
    profiles.value = await analysisService.getProfiles()
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load profiles'
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
    <div class="flex items-center justify-between flex-wrap gap-4">
      <h1 class="text-2xl font-bold text-white">Aggregated Profiles</h1>

      <!-- Sort dropdown -->
      <div class="flex items-center gap-2">
        <label for="sort-select" class="text-sm text-gray-400">Sort by:</label>
        <select
          id="sort-select"
          v-model="sortKey"
          class="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="setSort(sortKey)"
        >
          <option value="rank">Rank</option>
          <option value="percentile">Percentile</option>
          <option value="trend">Trend</option>
          <option value="stability">Stability</option>
        </select>
        <button
          class="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
          :title="sortAscending ? 'Ascending' : 'Descending'"
          @click="sortAscending = !sortAscending"
        >
          <span class="text-gray-400">{{ sortAscending ? '↑' : '↓' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <template v-if="isLoading">
      <div class="space-y-3">
        <div v-for="i in 5" :key="i" class="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <BaseSkeleton variant="rectangular" height="4.5rem" />
        </div>
      </div>
    </template>

    <!-- Error state -->
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadData" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="sortedProfiles.length === 0"
      icon="📋"
      title="No profile data"
      description="Aggregated profiles will appear once people have been analyzed."
    />

    <!-- Profile list -->
    <div v-else class="space-y-3">
      <BaseCard
        v-for="profile in sortedProfiles"
        :key="profile.personId"
        padding="md"
        hoverable
        clickable
        @click="navigateToPerson(profile.personId)"
      >
        <div class="flex items-center gap-4">
          <!-- Rank number -->
          <div class="w-10 flex-shrink-0 text-center">
            <span
              v-if="profile.rank <= 3"
              class="text-xl"
            >{{ rankDisplay(profile.rank) }}</span>
            <span
              v-else
              class="text-sm font-bold text-gray-500"
            >#{{ profile.rank }}</span>
          </div>

          <!-- Avatar -->
          <PersonAvatar
            :name="profile.displayName"
            :role="profile.role"
            size="md"
          />

          <!-- Info -->
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-white">{{ profile.displayName }}</span>
              <RoleBadge :role="profile.role" size="sm" />
            </div>

            <!-- Percentile bar -->
            <ProgressBar
              :value="profile.percentile"
              :max="100"
              :color="percentileColor(profile.percentile)"
              size="sm"
              :label="`${Math.round(profile.percentile)}th percentile`"
              show-value
            />

            <!-- Summary -->
            <p class="text-xs text-gray-500 leading-relaxed line-clamp-2">{{ profile.summary }}</p>
          </div>

          <!-- Trend + Stability -->
          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            <span :class="['text-sm font-medium', trendColor(profile.trend)]">
              {{ trendIcon(profile.trend) }} {{ trendLabels[profile.trend] || profile.trend }}
            </span>
            <span class="text-xs text-gray-500">
              Stability: {{ (profile.stability * 100).toFixed(0) }}%
            </span>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
