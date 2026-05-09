<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient, { handleApiError } from '@/services/api'
import type { Relationship, Quality, Protocol, Person } from '@/types/domain'
import { QUALITY_COLORS, ROLE_COLORS } from '@/utils/constants'
import { formatDate, truncate } from '@/utils/formatters'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const relationships = ref<Relationship[]>([])
const peopleMap = ref<Record<string, string>>({})

const searchQuery = ref('')
const qualityFilter = ref<Quality | ''>('')
const sortBy = ref<'strength' | 'reciprocity' | 'updated_at'>('strength')

const qualities: Quality[] = ['nourishing', 'neutral', 'draining', 'conflicted', 'unknown']
const protocols: Protocol[] = ['deep', 'casual', 'professional', 'digital', 'mixed']

const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
    fetchRelationships()
  }, 300)
})

watch([qualityFilter, sortBy], () => {
  fetchRelationships()
})

const filteredRelationships = computed(() => {
  let result = [...relationships.value]
  if (qualityFilter.value) {
    result = result.filter((r) => r.quality === qualityFilter.value)
  }
  if (debouncedSearch.value) {
    const q = debouncedSearch.value.toLowerCase()
    result = result.filter((r) => {
      const srcName = peopleMap.value[r.source_person_id] ?? r.source_person_id
      const tgtName = peopleMap.value[r.target_person_id] ?? r.target_person_id
      return srcName.toLowerCase().includes(q) || tgtName.toLowerCase().includes(q) || (r.label || '').toLowerCase().includes(q)
    })
  }
  result.sort((a, b) => {
    if (sortBy.value === 'strength') return b.strength - a.strength
    if (sortBy.value === 'reciprocity') return b.reciprocity_index - a.reciprocity_index
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
  return result
})

function getQualityColor(quality: Quality): string {
  return (QUALITY_COLORS[quality] ?? QUALITY_COLORS['unknown'])!
}

function getProtocolColor(protocol: Protocol): string {
  const colors: Record<string, string> = {
    deep: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    casual: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    digital: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    mixed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  }
  return (colors[protocol] ?? colors['mixed'])!
}

function getPersonName(id: string): string {
  return peopleMap.value[id] ?? 'Unknown'
}

function getStrengthColor(strength: number): string {
  if (strength >= 0.7) return 'bg-green-500'
  if (strength >= 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function hasReciprocityImbalance(rel: Relationship): boolean {
  return Math.abs(rel.source_weight - rel.target_weight) > 0.2
}

function goToHealth(id: string) {
  router.push(`/relationships/${id}/health`)
}

async function fetchRelationships() {
  loading.value = true
  error.value = ''
  try {
    const res = await apiClient.get<Relationship[]>('/relationships')
    relationships.value = res.data
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

async function fetchPeople() {
  try {
    const res = await apiClient.get<Person[]>('/people')
    const map: Record<string, string> = {}
    for (const p of res.data) {
      map[p.id] = p.display_name
    }
    peopleMap.value = map
  } catch {
    // People fetch failure is non-critical
  }
}

onMounted(async () => {
  await Promise.allSettled([fetchRelationships(), fetchPeople()])
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-4xl px-6 py-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Relationships</h1>

      <!-- Filters -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search relationships..."
            class="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
        <select
          v-model="qualityFilter"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm capitalize dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All qualities</option>
          <option v-for="q in qualities" :key="q" :value="q">{{ q }}</option>
        </select>
        <select
          v-model="sortBy"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="strength">Sort by strength</option>
          <option value="reciprocity">Sort by reciprocity</option>
          <option value="updated_at">Sort by recent</option>
        </select>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
        {{ error }}
        <button class="ml-2 font-medium text-red-600 underline hover:text-red-500" @click="fetchRelationships">Retry</button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading && relationships.length === 0" class="space-y-3">
        <div v-for="i in 5" :key="i" class="animate-pulse rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
          <div class="flex items-center justify-between">
            <div class="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div class="mt-3 h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!loading && filteredRelationships.length === 0"
        class="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800"
      >
        <svg class="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <h2 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">No relationships found</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ searchQuery || qualityFilter ? 'Try adjusting your filters.' : 'Analyze interactions to discover relationships.' }}
        </p>
      </div>

      <!-- Relationships list -->
      <div v-else class="space-y-3">
        <div
          v-for="rel in filteredRelationships"
          :key="rel.id"
          class="cursor-pointer rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 transition-shadow hover:shadow-md dark:bg-gray-800 dark:ring-white/10"
          @click="goToHealth(rel.id)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium text-gray-900 dark:text-white">{{ getPersonName(rel.source_person_id) }}</span>
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span class="font-medium text-gray-900 dark:text-white">{{ getPersonName(rel.target_person_id) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                :style="{
                  backgroundColor: getQualityColor(rel.quality) + '20',
                  color: getQualityColor(rel.quality),
                }"
              >
                {{ rel.quality }}
              </span>
              <span :class="['inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize', getProtocolColor(rel.protocol)]">
                {{ rel.protocol }}
              </span>
            </div>
          </div>

          <!-- Strength bar -->
          <div class="mt-3 flex items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400 w-14">Strength</span>
            <div class="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-600">
              <div
                class="h-1.5 rounded-full"
                :class="getStrengthColor(rel.strength)"
                :style="{ width: `${rel.strength * 100}%` }"
              />
            </div>
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ (rel.strength * 100).toFixed(0) }}%</span>
          </div>

          <!-- Reciprocity -->
          <div class="mt-1 flex items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400 w-14">Balance</span>
            <div class="flex flex-1 items-center gap-1">
              <div class="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  class="h-1.5 rounded-full bg-blue-500"
                  :style="{ width: `${rel.source_weight * 100}%` }"
                />
              </div>
            </div>
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ (rel.source_weight * 100).toFixed(0) }}% / {{ (rel.target_weight * 100).toFixed(0) }}%
            </span>
          </div>

          <!-- Reciprocity imbalance warning -->
          <div
            v-if="hasReciprocityImbalance(rel)"
            class="mt-2 flex items-center gap-1 rounded bg-yellow-50 px-2 py-1 dark:bg-yellow-900/20"
          >
            <svg class="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-xs text-yellow-700 dark:text-yellow-400">Reciprocity imbalance detected</span>
          </div>

          <div v-if="rel.label" class="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {{ rel.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
