<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient, { handleApiError } from '@/services/api'
import type { Person, NodeMetrics, Relationship, PersonState, SocialRole, TrendDirection } from '@/types/domain'
import type { RoleClassification, AggregatedProfile } from '@/types/graph'
import { ROLE_COLORS, MOOD_EMOJIS } from '@/utils/constants'
import { getRoleColor, getMoodEmoji, formatDate, formatPercent, formatScore } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const personId = computed(() => route.params.id as string)

const loading = ref(true)
const error = ref('')

const person = ref<Person | null>(null)
const metrics = ref<NodeMetrics | null>(null)
const roleClassification = ref<RoleClassification | null>(null)
const relationships = ref<Relationship[]>([])
const timeline = ref<PersonState[]>([])
const profile = ref<AggregatedProfile | null>(null)

const activeTab = ref<'metrics' | 'roles' | 'relationships' | 'timeline' | 'profile'>('metrics')

const tabs = [
  { key: 'metrics' as const, label: 'Metrics' },
  { key: 'roles' as const, label: 'Roles' },
  { key: 'relationships' as const, label: 'Relationships' },
  { key: 'timeline' as const, label: 'Timeline' },
  { key: 'profile' as const, label: 'Profile' },
]

const centralityLabels: Record<string, string> = {
  degree: 'Degree',
  betweenness: 'Betweenness',
  closeness: 'Closeness',
  eigenvector: 'Eigenvector',
  pagerank: 'PageRank',
  clustering_coef: 'Clustering',
}

const healthDimensions = [
  { key: 'reciprocity', label: 'Reciprocity' },
  { key: 'communication', label: 'Communication' },
  { key: 'trust', label: 'Trust' },
  { key: 'support', label: 'Support' },
  { key: 'compatibility', label: 'Compatibility' },
  { key: 'growth', label: 'Growth' },
  { key: 'resilience', label: 'Resilience' },
]

const trendIcon = (trend: TrendDirection) => {
  switch (trend) {
    case 'improving': return '↗'
    case 'declining': return '↘'
    case 'volatile': return '↕'
    default: return '→'
  }
}

const trendColor = (trend: TrendDirection) => {
  switch (trend) {
    case 'improving': return 'text-green-600 dark:text-green-400'
    case 'declining': return 'text-red-600 dark:text-red-400'
    case 'volatile': return 'text-yellow-600 dark:text-yellow-400'
    default: return 'text-gray-500 dark:text-gray-400'
  }
}

function getScoreBarColor(score: number): string {
  if (score >= 0.7) return 'bg-green-500'
  if (score >= 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w.charAt(0)).join('').toUpperCase().slice(0, 2)
}

function getEnergyColor(energy: number): string {
  if (energy >= 7) return 'bg-green-500'
  if (energy >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

async function fetchPerson() {
  error.value = ''
  try {
    const res = await apiClient.get<Person>(`/people/${personId.value}`)
    person.value = res.data
  } catch (err) {
    error.value = handleApiError(err)
  }
}

async function fetchMetrics() {
  try {
    const res = await apiClient.get<NodeMetrics>(`/people/${personId.value}/metrics`)
    metrics.value = res.data
  } catch {
    // Metrics may not exist yet
  }
}

async function fetchRoles() {
  try {
    const res = await apiClient.get<RoleClassification>(`/people/${personId.value}/roles`)
    roleClassification.value = res.data
  } catch {
    // Roles may not exist yet
  }
}

async function fetchRelationships() {
  try {
    const res = await apiClient.get<Relationship[]>(`/people/${personId.value}/relationships`)
    relationships.value = res.data
  } catch {
    // Relationships may not exist yet
  }
}

async function fetchTimeline() {
  try {
    const res = await apiClient.get<PersonState[]>(`/people/${personId.value}/timeline`)
    timeline.value = res.data
  } catch {
    // Timeline may not exist yet
  }
}

async function fetchProfile() {
  try {
    const res = await apiClient.get<AggregatedProfile>(`/people/${personId.value}/profile`)
    profile.value = res.data
  } catch {
    // Profile may not exist yet
  }
}

function goBack() {
  router.push('/people')
}

onMounted(async () => {
  loading.value = true
  await Promise.allSettled([
    fetchPerson(),
    fetchMetrics(),
    fetchRoles(),
    fetchRelationships(),
    fetchTimeline(),
    fetchProfile(),
  ])
  loading.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-5xl px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div class="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-md bg-red-50 p-6 text-center dark:bg-red-900/20">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <button class="mt-2 text-sm text-blue-600 underline" @click="goBack">Go back</button>
      </div>

      <template v-else-if="person">
        <!-- Header -->
        <div class="mb-6 flex items-center gap-4">
          <button
            class="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            @click="goBack"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ person.display_name }}</h1>
        </div>

        <!-- Profile section -->
        <div class="mb-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
            <!-- Avatar -->
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
              :style="{ backgroundColor: getRoleColor(person.social_role) }"
            >
              {{ getInitials(person.display_name) }}
            </div>

            <div class="flex-1 space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ person.display_name }}</h2>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :style="{
                    backgroundColor: getRoleColor(person.social_role) + '20',
                    color: getRoleColor(person.social_role),
                  }"
                >
                  {{ person.social_role }}
                  <span v-if="roleClassification" class="opacity-70">
                    ({{ (roleClassification.confidence * 100).toFixed(0) }}%)
                  </span>
                </span>
              </div>

              <div class="flex flex-wrap gap-4 text-sm">
                <span class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  {{ getMoodEmoji(person.current_mood) }}
                  <span class="capitalize">{{ person.current_mood }}</span>
                </span>
                <span class="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  Energy:
                  <div class="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      class="h-1.5 rounded-full"
                      :class="getEnergyColor(person.current_energy)"
                      :style="{ width: `${(person.current_energy / 10) * 100}%` }"
                    />
                  </div>
                  <span class="text-xs">{{ person.current_energy }}/10</span>
                </span>
              </div>

              <div v-if="person.aliases.length > 0" class="text-sm text-gray-500 dark:text-gray-400">
                <span class="font-medium">Aliases:</span> {{ person.aliases.join(', ') }}
              </div>

              <p v-if="person.notes" class="text-sm text-gray-600 dark:text-gray-400">
                {{ person.notes }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav class="-mb-px flex space-x-6">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors"
              :class="activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab content -->
        <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
          <!-- Metrics tab -->
          <div v-if="activeTab === 'metrics'">
            <div v-if="!metrics" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No metrics data available yet
            </div>
            <template v-else>
              <!-- Stat cards -->
              <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Degree</p>
                  <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">{{ metrics.degree }}</p>
                </div>
                <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
                  <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">{{ metrics.interaction_frequency.toFixed(1) }}</p>
                </div>
                <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Valence</p>
                  <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">{{ metrics.emotional_valence.toFixed(2) }}</p>
                </div>
                <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Trend</p>
                  <p class="mt-1 text-xl font-bold" :class="trendColor(metrics.trend_direction)">
                    {{ trendIcon(metrics.trend_direction) }} {{ metrics.trend_direction }}
                  </p>
                </div>
              </div>

              <!-- Centrality scores (RadarChart placeholder) -->
              <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Centrality Scores</h3>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div v-for="(label, key) in centralityLabels" :key="key" class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ label }}</p>
                  <p class="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                    {{ formatScore(metrics.centrality[key as keyof typeof metrics.centrality]) }}
                  </p>
                  <div class="mt-1 h-1 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      class="h-1 rounded-full bg-blue-500"
                      :style="{ width: `${Math.min(metrics.centrality[key as keyof typeof metrics.centrality] * 100, 100)}%` }"
                    />
                  </div>
                </div>
              </div>

              <!-- Health dimensions -->
              <h3 class="mb-3 mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Relational Health</h3>
              <div class="space-y-2">
                <div v-for="dim in healthDimensions" :key="dim.key" class="flex items-center gap-3">
                  <span class="w-28 text-xs text-gray-500 dark:text-gray-400">{{ dim.label }}</span>
                  <div class="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="getScoreBarColor(metrics.relational_health[dim.key as keyof typeof metrics.relational_health])"
                      :style="{ width: `${metrics.relational_health[dim.key as keyof typeof metrics.relational_health] * 100}%` }"
                    />
                  </div>
                  <span class="w-10 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                    {{ formatPercent(metrics.relational_health[dim.key as keyof typeof metrics.relational_health]) }}
                  </span>
                </div>
              </div>

              <!-- Social capital -->
              <h3 class="mb-3 mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Social Capital</h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{{ formatScore(metrics.social_capital.total) }}</p>
                </div>
                <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Bonding</p>
                  <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{{ formatScore(metrics.social_capital.bonding) }}</p>
                </div>
                <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Bridging</p>
                  <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{{ formatScore(metrics.social_capital.bridging) }}</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Roles tab -->
          <div v-else-if="activeTab === 'roles'">
            <div v-if="!roleClassification" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No role classification data available yet
            </div>
            <template v-else>
              <h3 class="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Primary Role</h3>
              <div class="mb-6 flex items-center gap-3">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize"
                  :style="{
                    backgroundColor: getRoleColor(roleClassification.primary_role) + '20',
                    color: getRoleColor(roleClassification.primary_role),
                  }"
                >
                  {{ roleClassification.primary_role }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Confidence: {{ (roleClassification.confidence * 100).toFixed(0) }}%
                </span>
              </div>

              <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Role Scores</h3>
              <div class="space-y-2">
                <div v-for="(score, role) in roleClassification.scores" :key="role" class="flex items-center gap-3">
                  <span
                    class="w-20 rounded-full px-2 py-0.5 text-center text-xs font-medium capitalize"
                    :style="{
                      backgroundColor: getRoleColor(role as SocialRole) + '20',
                      color: getRoleColor(role as SocialRole),
                    }"
                  >
                    {{ role }}
                  </span>
                  <div class="h-3 flex-1 rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      class="h-3 rounded-full"
                      :style="{ width: `${score * 100}%`, backgroundColor: getRoleColor(role as SocialRole) }"
                    />
                  </div>
                  <span class="w-12 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                    {{ (score * 100).toFixed(0) }}%
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- Relationships tab -->
          <div v-else-if="activeTab === 'relationships'">
            <div v-if="relationships.length === 0" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No relationships recorded yet
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="rel in relationships"
                :key="rel.id"
                class="cursor-pointer rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                @click="router.push(`/relationships/${rel.id}/health`)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                      :style="{
                        backgroundColor: QUALITY_COLORS[rel.quality] + '20',
                        color: QUALITY_COLORS[rel.quality],
                      }"
                    >
                      {{ rel.quality }}
                    </span>
                    <span class="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      {{ rel.protocol }}
                    </span>
                    <span v-if="rel.label" class="text-xs text-gray-500 dark:text-gray-400">{{ rel.label }}</span>
                  </div>
                  <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div class="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Strength: {{ (rel.strength * 100).toFixed(0) }}%</span>
                  <span>Reciprocity: {{ (rel.reciprocity_index * 100).toFixed(0) }}%</span>
                  <span>{{ formatDate(rel.updated_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline tab -->
          <div v-else-if="activeTab === 'timeline'">
            <div v-if="timeline.length === 0" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No timeline data available yet
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="(state, idx) in timeline"
                :key="state.id"
                class="flex gap-4 py-3"
                :class="{ 'border-t border-gray-100 dark:border-gray-700': idx > 0 }"
              >
                <div class="flex flex-col items-center">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm dark:bg-blue-900/30">
                    {{ getMoodEmoji(state.mood) }}
                  </div>
                  <div v-if="idx < timeline.length - 1" class="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-900 dark:text-white capitalize">{{ state.mood }}</span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(state.created_at) }}</span>
                  </div>
                  <p v-if="state.context" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ state.context }}</p>
                  <p v-if="state.trigger" class="text-xs text-gray-400 dark:text-gray-500">Trigger: {{ state.trigger }}</p>
                  <div class="mt-1 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Energy: {{ state.energy }}/10</span>
                    <span>Valence: {{ state.valence.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile tab -->
          <div v-else-if="activeTab === 'profile'">
            <div v-if="!profile" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No profile data available yet
            </div>
            <template v-else>
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Rank</p>
                  <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">#{{ profile.rank }}</p>
                </div>
                <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Percentile</p>
                  <div class="mt-1 flex items-end gap-1">
                    <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ (profile.percentile * 100).toFixed(0) }}</span>
                    <span class="mb-1 text-xs text-gray-400">%</span>
                  </div>
                  <div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                    <div class="h-1.5 rounded-full bg-blue-500" :style="{ width: `${profile.percentile * 100}%` }" />
                  </div>
                </div>
                <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Trend</p>
                  <p class="mt-1 text-2xl font-bold" :class="trendColor(profile.trend as TrendDirection)">
                    {{ trendIcon(profile.trend as TrendDirection) }}
                  </p>
                </div>
                <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Stability</p>
                  <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ (profile.stability * 100).toFixed(0) }}%</p>
                </div>
              </div>
              <div v-if="profile.summary" class="mt-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Summary</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ profile.summary }}</p>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { QUALITY_COLORS } from '@/utils/constants'
export default { }
</script>
