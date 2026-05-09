<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient, { handleApiError } from '@/services/api'
import type { GraphStats, GraphData } from '@/types/graph'
import type { Interaction } from '@/types/domain'
import { formatDate } from '@/utils/formatters'

const loading = ref(true)
const error = ref('')
const hasData = ref(false)

const stats = ref<GraphStats | null>(null)
const recentInteractions = ref<Interaction[]>([])
const strongestConnections = ref<{ name: string; strength: number }[]>([])
const emotionalHistory = ref<{ date: string; valence: number }[]>([])

const statsError = ref('')
const graphError = ref('')
const interactionsError = ref('')
const connectionsError = ref('')
const emotionalError = ref('')

async function fetchStats() {
  statsError.value = ''
  try {
    const res = await apiClient.get<GraphData>('/graph')
    stats.value = res.data.stats
    if (res.data.nodes.length > 0 || res.data.edges.length > 0) {
      hasData.value = true
    }
    const edgeStrengths = res.data.edges
      .map((e) => ({ strength: e.strength }))
      .sort((a, b) => b.strength - a.strength)
    strongestConnections.value = edgeStrengths.slice(0, 5).map((e) => ({
      name: 'Connection',
      strength: e.strength,
    }))
  } catch (err) {
    statsError.value = handleApiError(err)
  }
}

async function fetchRecentInteractions() {
  interactionsError.value = ''
  try {
    const res = await apiClient.get<Interaction[]>('/interactions', {
      params: { limit: 5 },
    })
    recentInteractions.value = res.data
    if (res.data.length > 0) hasData.value = true
  } catch (err) {
    interactionsError.value = handleApiError(err)
  }
}

async function fetchEmotionalHistory() {
  emotionalError.value = ''
  try {
    const res = await apiClient.get<{ date: string; valence: number }[]>('/states/emotional-sparkline')
    emotionalHistory.value = res.data
  } catch (err) {
    emotionalError.value = handleApiError(err)
  }
}

function sparklinePoints(data: { valence: number }[]): string {
  if (data.length === 0) return ''
  const width = 200
  const height = 40
  const step = width / (data.length - 1 || 1)
  const min = Math.min(...data.map((d) => d.valence))
  const max = Math.max(...data.map((d) => d.valence))
  const range = max - min || 1
  return data
    .map((d, i) => {
      const x = i * step
      const y = height - ((d.valence - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
}

onMounted(async () => {
  loading.value = true
  await Promise.allSettled([fetchStats(), fetchRecentInteractions(), fetchEmotionalHistory()])
  loading.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
    <div class="mx-auto max-w-7xl">
      <h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      <!-- Welcome CTA when no data -->
      <div
        v-if="!loading && !hasData"
        class="mb-8 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800"
      >
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <svg class="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Welcome to BubbleTracker</h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Start by analyzing your first interaction to build your social graph.
        </p>
        <div class="flex justify-center gap-3">
          <router-link
            to="/analysis"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Analyze an Interaction
          </router-link>
          <router-link
            to="/chat"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Open Chat
          </router-link>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div class="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div class="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div class="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <!-- Stats row -->
      <section v-if="!loading" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-if="statsError"
          class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        >
          <p class="text-xs text-red-600 dark:text-red-400">Failed to load stats</p>
        </div>
        <template v-else-if="stats">
          <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <p class="text-sm text-gray-500 dark:text-gray-400">People</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total_people }}</p>
          </div>
          <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <p class="text-sm text-gray-500 dark:text-gray-400">Relationships</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total_relationships }}</p>
          </div>
          <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <p class="text-sm text-gray-500 dark:text-gray-400">Avg Reciprocity</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {{ (stats.avg_reciprocity * 100).toFixed(0) }}%
            </p>
          </div>
          <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <p class="text-sm text-gray-500 dark:text-gray-400">Bridges</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ stats.bridge_count }}</p>
          </div>
        </template>
      </section>

      <!-- Main content grid -->
      <div v-if="!loading" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Graph preview -->
        <section class="lg:col-span-2">
          <div v-if="graphError" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p class="text-xs text-red-600 dark:text-red-400">Failed to load graph preview</p>
          </div>
          <div v-else class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Social Graph Preview</h2>
              <router-link to="/graph" class="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400">
                View Full Graph
              </router-link>
            </div>
            <div class="flex h-56 items-center justify-center rounded-md bg-gray-50 dark:bg-gray-700">
              <p class="text-sm text-gray-400 dark:text-gray-500">
                <router-link to="/graph" class="hover:text-blue-500">Open graph view</router-link> for interactive visualization
              </p>
            </div>
          </div>
        </section>

        <!-- Emotional sparkline -->
        <section>
          <div v-if="emotionalError" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p class="text-xs text-red-600 dark:text-red-400">Failed to load emotional data</p>
          </div>
          <div v-else class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Emotional Trend</h2>
            <div v-if="emotionalHistory.length > 0" class="flex h-40 items-end justify-center">
              <svg :viewBox="`0 0 200 40`" class="h-full w-full">
                <polyline
                  :points="sparklinePoints(emotionalHistory)"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div v-else class="flex h-40 items-center justify-center">
              <p class="text-sm text-gray-400 dark:text-gray-500">No emotional data yet</p>
            </div>
          </div>
        </section>
      </div>

      <!-- Bottom row -->
      <div v-if="!loading" class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Recent interactions -->
        <section>
          <div v-if="interactionsError" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p class="text-xs text-red-600 dark:text-red-400">Failed to load interactions</p>
          </div>
          <div v-else class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Recent Interactions</h2>
              <router-link to="/analysis" class="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400">
                View All
              </router-link>
            </div>
            <div v-if="recentInteractions.length === 0" class="py-8 text-center">
              <p class="text-sm text-gray-400 dark:text-gray-500">No interactions recorded yet</p>
            </div>
            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
              <li
                v-for="interaction in recentInteractions"
                :key="interaction.id"
                class="py-3"
              >
                <p class="text-sm text-gray-900 dark:text-white line-clamp-2">
                  {{ interaction.raw_text.slice(0, 100) }}{{ interaction.raw_text.length > 100 ? '...' : '' }}
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(interaction.created_at) }}
                  <span
                    class="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="{
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': interaction.status === 'pending',
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': interaction.status === 'processing',
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': interaction.status === 'completed',
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': interaction.status === 'failed',
                    }"
                  >
                    {{ interaction.status }}
                  </span>
                </p>
              </li>
            </ul>
          </div>
        </section>

        <!-- Strongest connections -->
        <section>
          <div v-if="connectionsError" class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p class="text-xs text-red-600 dark:text-red-400">Failed to load connections</p>
          </div>
          <div v-else class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Strongest Connections</h2>
              <router-link to="/relationships" class="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400">
                View All
              </router-link>
            </div>
            <div v-if="strongestConnections.length === 0" class="py-8 text-center">
              <p class="text-sm text-gray-400 dark:text-gray-500">No connections yet</p>
            </div>
            <ul v-else class="space-y-3">
              <li v-for="(conn, i) in strongestConnections" :key="i" class="flex items-center gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {{ i + 1 }}
                </span>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ conn.name }}</p>
                  <div class="mt-1 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      class="h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                      :style="{ width: `${conn.strength * 100}%` }"
                    />
                  </div>
                </div>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ (conn.strength * 100).toFixed(0) }}%
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
