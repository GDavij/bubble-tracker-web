<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import TimelineChart from '@/components/charts/TimelineChart.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { statesService } from '@/services/states.service'
import { usePeopleStore } from '@/stores/people'
import { MOOD_EMOJIS } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'
import type { PersonState, Mood } from '@/types/domain'
import type { GraphNode } from '@/types/graph'

// --- Data ---
const allStates = ref<PersonState[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const peopleStore = usePeopleStore()

// --- Chart metric toggle ---
type ChartMetric = 'energy' | 'valence' | 'mood'
const chartMetric = ref<ChartMetric>('energy')
const metricOptions: { value: ChartMetric; label: string }[] = [
  { value: 'energy', label: 'Energy' },
  { value: 'valence', label: 'Valence' },
  { value: 'mood', label: 'Mood' },
]

// --- Filters ---
type DateRange = '7d' | '30d' | '90d' | 'all'
const dateRange = ref<DateRange>('30d')
const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
]

const selectedPersonIds = ref<string[]>([])
const selectedMoods = ref<string[]>([])
const selectedContexts = ref<string[]>([])

const allMoods: Mood[] = [
  'happy', 'anxious', 'tired', 'energized', 'sad',
  'neutral', 'angry', 'hopeful', 'lonely', 'grateful',
]

const allContexts = computed<string[]>(() => {
  const set = new Set<string>()
  for (const s of allStates.value) {
    if (s.context) set.add(s.context)
  }
  return Array.from(set).sort()
})

// --- Computed filtered data ---
const dateCutoff = computed(() => {
  if (dateRange.value === 'all') return null
  const now = new Date()
  const days = parseInt(dateRange.value)
  return new Date(now.getTime() - days * 86400000)
})

const filteredStates = computed(() => {
  return allStates.value.filter((s) => {
    if (dateCutoff.value && new Date(s.created_at) < dateCutoff.value) return false
    if (selectedPersonIds.value.length > 0 && s.person_id && !selectedPersonIds.value.includes(s.person_id)) return false
    if (selectedMoods.value.length > 0 && !selectedMoods.value.includes(s.mood)) return false
    if (selectedContexts.value.length > 0 && !selectedContexts.value.includes(s.context)) return false
    return true
  })
})

const groupedEntries = computed(() => {
  const groups: Record<string, PersonState[]> = {}
  for (const s of filteredStates.value) {
    const dateKey = new Date(s.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(s)
  }
  // Sort groups reverse-chronologically
  const sorted = Object.entries(groups).sort((a, b) => {
    const dateA = new Date(a[1][0]!.created_at).getTime()
    const dateB = new Date(b[1][0]!.created_at).getTime()
    return dateB - dateA
  })
  return sorted
})

const isSelfReflection = (state: PersonState): boolean => {
  return state.person_id === null || state.context === 'self-reflection'
}

const isFiltered = computed(() => {
  return (
    selectedPersonIds.value.length > 0 ||
    selectedMoods.value.length > 0 ||
    selectedContexts.value.length > 0 ||
    dateRange.value !== '30d'
  )
})

// --- Toggle helpers ---
function togglePersonFilter(personId: string) {
  const idx = selectedPersonIds.value.indexOf(personId)
  if (idx >= 0) selectedPersonIds.value.splice(idx, 1)
  else selectedPersonIds.value.push(personId)
}

function toggleMoodFilter(mood: string) {
  const idx = selectedMoods.value.indexOf(mood)
  if (idx >= 0) selectedMoods.value.splice(idx, 1)
  else selectedMoods.value.push(mood)
}

function toggleContextFilter(context: string) {
  const idx = selectedContexts.value.indexOf(context)
  if (idx >= 0) selectedContexts.value.splice(idx, 1)
  else selectedContexts.value.push(context)
}

function clearFilters() {
  selectedPersonIds.value = []
  selectedMoods.value = []
  selectedContexts.value = []
  dateRange.value = '30d'
}

function getEnergyColor(energy: number): string {
  if (energy >= 7) return 'bg-green-500'
  if (energy >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getValenceColor(valence: number): string {
  if (valence >= 0.6) return 'text-green-400'
  if (valence >= 0.3) return 'text-yellow-400'
  return 'text-red-400'
}

function getValenceIcon(valence: number): string {
  if (valence >= 0.6) return '↑'
  if (valence >= 0.3) return '→'
  return '↓'
}

// --- Data fetching ---
async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const [timelineRes, selfStatesRes] = await Promise.all([
      statesService.getTimeline(200),
      statesService.getSelfStates(100),
    ])
    // Merge both sources, deduplicate by id
    const seen = new Set<string>()
    const merged: PersonState[] = []
    for (const s of [...timelineRes.states, ...selfStatesRes.states]) {
      if (!seen.has(s.id)) {
        seen.add(s.id)
        merged.push(s)
      }
    }
    allStates.value = merged
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load timeline data'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  peopleStore.fetchList()
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-semibold text-white mb-1">Emotional Timeline</h2>
      <p class="text-sm text-gray-500">
        Track energy, valence, and mood over time across your interactions.
      </p>
    </div>

    <!-- Loading state -->
    <template v-if="loading">
      <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <BaseSkeleton variant="rectangular" height="240px" />
      </div>
      <div class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2"
        >
          <BaseSkeleton variant="text" width="50%" height="1rem" />
          <BaseSkeleton variant="text" width="80%" height="0.75rem" />
        </div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else-if="error">
      <ErrorState :message="error" @retry="fetchData" />
    </div>

    <template v-else-if="allStates.length === 0">
      <div class="bg-gray-900 rounded-xl border border-gray-800">
        <EmptyState
          title="No timeline data yet"
          description="Start logging interactions and self-reflections to see your emotional timeline."
        />
      </div>
    </template>

    <template v-else>
      <!-- Chart -->
      <div class="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex gap-1.5">
            <button
              v-for="opt in metricOptions"
              :key="opt.value"
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="
                chartMetric === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              "
              @click="chartMetric = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">Filters:</span>
            <button
              v-if="isFiltered"
              class="text-xs text-blue-400 hover:text-blue-300"
              @click="clearFilters"
            >
              Clear all
            </button>
          </div>
        </div>
        <TimelineChart
          :states="filteredStates"
          :metric="chartMetric"
        />
      </div>

      <!-- Filter Section -->
      <div class="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
        <!-- Date range -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">Date Range</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in dateRangeOptions"
              :key="opt.value"
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="
                dateRange === opt.value
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              "
              @click="dateRange = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- People filter -->
        <div v-if="peopleStore.list.length > 0">
          <label class="block text-xs font-medium text-gray-400 mb-2">People</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="person in peopleStore.list"
              :key="person.id"
              class="px-2.5 py-1 text-xs rounded-lg transition-colors"
              :class="
                selectedPersonIds.includes(person.id)
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              "
              @click="togglePersonFilter(person.id)"
            >
              {{ person.display_name }}
            </button>
          </div>
        </div>

        <!-- Mood filter -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">Moods</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="mood in allMoods"
              :key="mood"
              class="px-2.5 py-1 text-xs rounded-lg transition-colors"
              :class="
                selectedMoods.includes(mood)
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              "
              @click="toggleMoodFilter(mood)"
            >
              {{ MOOD_EMOJIS[mood] || '?' }} {{ mood }}
            </button>
          </div>
        </div>

        <!-- Context filter -->
        <div v-if="allContexts.length > 0">
          <label class="block text-xs font-medium text-gray-400 mb-2">Contexts</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="context in allContexts"
              :key="context"
              class="px-2.5 py-1 text-xs rounded-lg transition-colors max-w-[200px] truncate"
              :class="
                selectedContexts.includes(context)
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              "
              @click="toggleContextFilter(context)"
            >
              {{ context }}
            </button>
          </div>
        </div>
      </div>

      <!-- Timeline entries grouped by date -->
      <div class="space-y-6">
        <div v-if="groupedEntries.length === 0" class="bg-gray-900 rounded-xl border border-gray-800">
          <EmptyState
            title="No matching entries"
            description="Try adjusting your filters to find more entries."
          />
        </div>
        <div v-for="[dateLabel, entries] in groupedEntries" :key="dateLabel" class="space-y-2">
          <h3 class="text-sm font-medium text-gray-400 sticky top-0 bg-gray-950 py-2">
            {{ dateLabel }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="state in entries"
              :key="state.id"
              :class="[
                'rounded-xl border p-4 transition-colors',
                isSelfReflection(state)
                  ? 'bg-indigo-900/20 border-indigo-800/30'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700',
              ]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0">
                  <!-- Person name or self-reflection indicator -->
                  <span
                    v-if="isSelfReflection(state)"
                    class="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full"
                  >
                    Self-reflection
                  </span>
                  <span v-else class="text-sm font-medium text-white truncate">
                    {{ state.person_name || 'Unknown' }}
                  </span>

                  <!-- Mood emoji -->
                  <span
                    class="text-lg"
                    :title="state.mood"
                  >
                    {{ MOOD_EMOJIS[state.mood] || '😐' }}
                  </span>
                </div>

                <span class="text-xs text-gray-500 whitespace-nowrap">
                  {{ formatDate(state.created_at) }}
                </span>
              </div>

              <!-- Energy bar -->
              <div class="mt-3 flex items-center gap-2">
                <span class="text-xs text-gray-500 w-12">Energy</span>
                <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    :class="[
                      'h-full rounded-full transition-all',
                      getEnergyColor(state.energy),
                    ]"
                    :style="{ width: (state.energy / 10) * 100 + '%' }"
                  />
                </div>
                <span class="text-xs text-gray-400 w-6 text-right">{{ state.energy }}</span>
              </div>

              <!-- Valence indicator -->
              <div class="mt-1.5 flex items-center gap-2">
                <span class="text-xs text-gray-500 w-12">Valence</span>
                <span :class="['text-sm font-medium', getValenceColor(state.valence)]">
                  {{ getValenceIcon(state.valence) }}
                </span>
                <span :class="['text-xs', getValenceColor(state.valence)]">
                  {{ (state.valence * 100).toFixed(0) }}%
                </span>
              </div>

              <!-- Context & Trigger -->
              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span v-if="state.context" class="inline-flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {{ state.context }}
                </span>
                <span v-if="state.trigger" class="inline-flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ state.trigger }}
                </span>
              </div>

              <!-- Notes -->
              <p v-if="state.notes" class="mt-2 text-xs text-gray-400 italic line-clamp-2">
                {{ state.notes }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
