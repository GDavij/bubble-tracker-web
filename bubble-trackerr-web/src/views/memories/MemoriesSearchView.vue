<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { memoriesService } from '@/services/memories.service'
import { usePeopleStore } from '@/stores/people'
import MemoryResultCard from '@/components/memories/MemoryResultCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import type { MemoryResult } from '@/types/domain'

const peopleStore = usePeopleStore()

// --- Search state ---
const query = ref('')
const debouncedQuery = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// --- Filter state ---
const selectedPerson = ref<string>('')
const sessionFilter = ref('')
const segmentFilter = ref('')

// --- Results state ---
const results = ref<MemoryResult[]>([])
const loading = ref(false)
const searching = ref(false)
const error = ref<string | null>(null)
const searchTimeMs = ref<number | null>(null)

// --- Computed ---
const hasSearched = ref(false)
const hasActiveFilters = computed(
  () => selectedPerson.value !== '' || sessionFilter.value !== '' || segmentFilter.value !== '',
)
const hasQuery = computed(() => debouncedQuery.value.trim().length > 0)

const canSearch = computed(
  () => hasQuery.value || hasActiveFilters.value,
)

// --- Debounced search watcher ---
watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val
    if (val.trim().length > 0 || hasActiveFilters.value) {
      performSearch()
    } else {
      results.value = []
      hasSearched.value = false
      searchTimeMs.value = null
    }
  }, 300)
})

// Trigger search when filters change (only if there's already a query or results)
watch([selectedPerson, sessionFilter, segmentFilter], () => {
  if (hasQuery.value || results.value.length > 0) {
    performSearch()
  }
})

// --- Search ---
async function performSearch() {
  const q = debouncedQuery.value.trim()
  if (!canSearch.value) return

  loading.value = true
  searching.value = true
  error.value = null
  hasSearched.value = true

  const startTime = performance.now()

  try {
    const params: { limit?: number; person?: string; session?: string; segment?: string } = {}
    if (selectedPerson.value) params.person = selectedPerson.value
    if (sessionFilter.value.trim()) params.session = sessionFilter.value.trim()
    if (segmentFilter.value.trim()) params.segment = segmentFilter.value.trim()

    const res = await memoriesService.search(q, params)
    results.value = res.memories
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Search failed'
    results.value = []
  } finally {
    loading.value = false
    searching.value = false
    searchTimeMs.value = Math.round(performance.now() - startTime)
  }
}

function handleSearchSubmit() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debouncedQuery.value = query.value
  performSearch()
}

function clearAll() {
  query.value = ''
  debouncedQuery.value = ''
  selectedPerson.value = ''
  sessionFilter.value = ''
  segmentFilter.value = ''
  results.value = []
  hasSearched.value = false
  searchTimeMs.value = null
  error.value = null
}

onMounted(() => {
  peopleStore.fetchList()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-white mb-1">Memory Search</h2>
      <p class="text-sm text-gray-500">
        Search your past interactions and reflections.
      </p>
    </div>

    <!-- Search bar -->
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="Search your past interactions..."
          class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @keydown.enter="handleSearchSubmit"
        />
        <!-- Clear search button -->
        <button
          v-if="query"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          @click="clearAll"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Person filter -->
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs font-medium text-gray-400 mb-1">Person</label>
          <select
            v-model="selectedPerson"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All people</option>
            <option
              v-for="person in peopleStore.list"
              :key="person.id"
              :value="person.display_name"
            >
              {{ person.display_name }}
            </option>
          </select>
        </div>

        <!-- Session filter -->
        <div class="flex-1 min-w-[140px]">
          <label class="block text-xs font-medium text-gray-400 mb-1">Session</label>
          <input
            v-model="sessionFilter"
            type="text"
            placeholder="Session ID..."
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Segment filter -->
        <div class="flex-1 min-w-[140px]">
          <label class="block text-xs font-medium text-gray-400 mb-1">Segment</label>
          <input
            v-model="segmentFilter"
            type="text"
            placeholder="Segment..."
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Clear filters -->
        <div class="self-end">
          <button
            v-if="hasActiveFilters || hasQuery"
            class="px-3 py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            @click="clearAll"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>

    <!-- Results section -->
    <div>
      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3"
        >
          <BaseSkeleton variant="text" width="30%" height="1rem" />
          <BaseSkeleton variant="text" width="90%" height="0.75rem" />
          <BaseSkeleton variant="text" width="60%" height="0.75rem" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error">
        <ErrorState :message="error" @retry="performSearch" />
      </div>

      <!-- Initial empty state (before first search) -->
      <div
        v-else-if="!hasSearched"
        class="bg-gray-900 rounded-xl border border-gray-800"
      >
        <EmptyState
          icon="🔍"
          title="Search your past interactions"
          description="Enter a query above to find relevant memories, conversations, and insights."
        />
      </div>

      <!-- No results found -->
      <div
        v-else-if="results.length === 0"
        class="bg-gray-900 rounded-xl border border-gray-800"
      >
        <EmptyState
          icon="🔎"
          title="No results found"
          :description="
            hasActiveFilters
              ? 'Try adjusting your filters or search terms.'
              : 'No memories matched your query.'
          "
        />
      </div>

      <!-- Results list -->
      <div v-else class="space-y-4">
        <!-- Timing indicator -->
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-500">
            Found {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
            <template v-if="searchTimeMs !== null">
              in {{ searchTimeMs }}ms
            </template>
          </p>
        </div>

        <div class="space-y-3">
          <MemoryResultCard
            v-for="(result, index) in results"
            :key="result.metadata.interaction_id + '-' + index"
            :result="result"
            :query="debouncedQuery"
          />
        </div>
      </div>
    </div>
  </div>
</template>
