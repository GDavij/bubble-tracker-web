<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient, { handleApiError } from '@/services/api'
import type { Relationship, Person, PersonState } from '@/types/domain'
import type { NodeMetrics } from '@/types/graph'
import { QUALITY_COLORS } from '@/utils/constants'
import { formatDate, formatPercent } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const relationshipId = computed(() => route.params.id as string)

const loading = ref(true)
const error = ref('')

const relationship = ref<Relationship | null>(null)
const sourcePerson = ref<Person | null>(null)
const targetPerson = ref<Person | null>(null)
const sourceMetrics = ref<NodeMetrics | null>(null)
const targetMetrics = ref<NodeMetrics | null>(null)
const interactionHistory = ref<PersonState[]>([])

const healthDimensions = [
  { key: 'communication', label: 'Communication', icon: '💬' },
  { key: 'trust', label: 'Trust', icon: '🤝' },
  { key: 'support', label: 'Support', icon: '🛡️' },
  { key: 'compatibility', label: 'Compatibility', icon: '🎯' },
  { key: 'growth', label: 'Growth', icon: '📈' },
  { key: 'resilience', label: 'Resilience', icon: '💪' },
]

function getQualityColor(quality: string): string {
  return (QUALITY_COLORS[quality] ?? QUALITY_COLORS['unknown'])!
}

function getProtocolColor(protocol: string): string {
  const colors: Record<string, string> = {
    deep: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    casual: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    digital: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    mixed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  }
  return (colors[protocol] ?? colors['mixed'])!
}

function getHealthScore(key: string): number {
  if (!sourceMetrics.value) return 0
  return sourceMetrics.value.relational_health[key as keyof typeof sourceMetrics.value.relational_health] ?? 0
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return 'bg-green-500'
  if (score >= 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getScoreLabel(score: number): string {
  if (score >= 0.8) return 'Excellent'
  if (score >= 0.6) return 'Good'
  if (score >= 0.4) return 'Fair'
  if (score >= 0.2) return 'Needs Work'
  return 'Critical'
}

function getScoreTextColor(score: number): string {
  if (score >= 0.7) return 'text-green-600 dark:text-green-400'
  if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getStrengthColor(strength: number): string {
  if (strength >= 0.7) return 'bg-green-500'
  if (strength >= 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function goBack() {
  router.push('/relationships')
}

async function fetchRelationship() {
  error.value = ''
  try {
    const res = await apiClient.get<Relationship>(`/relationships/${relationshipId.value}`)
    relationship.value = res.data
  } catch (err) {
    error.value = handleApiError(err)
  }
}

async function fetchPeople() {
  if (!relationship.value) return
  try {
    const [srcRes, tgtRes] = await Promise.all([
      apiClient.get<Person>(`/people/${relationship.value.source_person_id}`),
      apiClient.get<Person>(`/people/${relationship.value.target_person_id}`),
    ])
    sourcePerson.value = srcRes.data
    targetPerson.value = tgtRes.data
  } catch {
    // Non-critical
  }
}

async function fetchMetrics() {
  if (!relationship.value) return
  try {
    const [srcRes, tgtRes] = await Promise.all([
      apiClient.get<NodeMetrics>(`/people/${relationship.value.source_person_id}/metrics`),
      apiClient.get<NodeMetrics>(`/people/${relationship.value.target_person_id}/metrics`),
    ])
    sourceMetrics.value = srcRes.data
    targetMetrics.value = tgtRes.data
  } catch {
    // Non-critical
  }
}

async function fetchInteractionHistory() {
  if (!relationship.value) return
  try {
    const res = await apiClient.get<PersonState[]>(`/relationships/${relationshipId.value}/history`)
    interactionHistory.value = res.data
  } catch {
    // Non-critical
  }
}

onMounted(async () => {
  loading.value = true
  await fetchRelationship()
  if (relationship.value) {
    await Promise.allSettled([fetchPeople(), fetchMetrics(), fetchInteractionHistory()])
  }
  loading.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-4xl px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-6 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div class="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-md bg-red-50 p-6 text-center dark:bg-red-900/20">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <button class="mt-2 text-sm text-blue-600 underline" @click="goBack">Go back</button>
      </div>

      <template v-else-if="relationship">
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
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ sourcePerson?.display_name ?? 'Unknown' }}
            <span class="mx-2 text-gray-400">&harr;</span>
            {{ targetPerson?.display_name ?? 'Unknown' }}
          </h1>
        </div>

        <!-- Health overview -->
        <div class="mb-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
          <h2 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Health Overview</h2>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <!-- Quality badge -->
            <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">Quality</p>
              <span
                class="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                :style="{
                  backgroundColor: getQualityColor(relationship.quality) + '20',
                  color: getQualityColor(relationship.quality),
                }"
              >
                {{ relationship.quality }}
              </span>
            </div>

            <!-- Strength -->
            <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">Strength</p>
              <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {{ (relationship.strength * 100).toFixed(0) }}%
              </p>
              <div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  class="h-1.5 rounded-full"
                  :class="getStrengthColor(relationship.strength)"
                  :style="{ width: `${relationship.strength * 100}%` }"
                />
              </div>
            </div>

            <!-- Reciprocity -->
            <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">Reciprocity</p>
              <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {{ (relationship.reciprocity_index * 100).toFixed(0) }}%
              </p>
              <div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  class="h-1.5 rounded-full bg-blue-500"
                  :style="{ width: `${relationship.reciprocity_index * 100}%` }"
                />
              </div>
            </div>

            <!-- Protocol -->
            <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">Protocol</p>
              <span
                :class="['mt-1 inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize', getProtocolColor(relationship.protocol)]"
              >
                {{ relationship.protocol }}
              </span>
            </div>

            <!-- Source weight -->
            <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ sourcePerson?.display_name ?? 'Source' }}</p>
              <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {{ (relationship.source_weight * 100).toFixed(0) }}%
              </p>
            </div>

            <!-- Target weight -->
            <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ targetPerson?.display_name ?? 'Target' }}</p>
              <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {{ (relationship.target_weight * 100).toFixed(0) }}%
              </p>
            </div>
          </div>
        </div>

        <!-- 6-dimension health scores -->
        <div class="mb-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
          <h2 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Health Dimensions</h2>

          <div v-if="!sourceMetrics" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No health metrics available yet
          </div>

          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="dim in healthDimensions"
              :key="dim.key"
              class="rounded-md border border-gray-200 p-4 dark:border-gray-700"
            >
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ dim.icon }}</span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ dim.label }}</span>
                </div>
                <span class="text-xs font-medium" :class="getScoreTextColor(getHealthScore(dim.key))">
                  {{ getScoreLabel(getHealthScore(dim.key)) }}
                </span>
              </div>

              <!-- HealthDimensionBar -->
              <div class="mb-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="getScoreColor(getHealthScore(dim.key))"
                  :style="{ width: `${getHealthScore(dim.key) * 100}%` }"
                />
              </div>
              <p class="text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ formatPercent(getHealthScore(dim.key)) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Interaction history -->
        <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
          <h2 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Interaction History</h2>

          <div v-if="interactionHistory.length === 0" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No interaction history available
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="entry in interactionHistory"
              :key="entry.id"
              class="flex items-start gap-3 rounded-md border border-gray-100 p-3 dark:border-gray-700"
            >
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm dark:bg-gray-700">
                {{ entry.mood === 'happy' ? '😊' : entry.mood === 'sad' ? '😢' : entry.mood === 'angry' ? '😠' : entry.mood === 'tired' ? '😴' : entry.mood === 'energized' ? '⚡' : '😐' }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-900 dark:text-white capitalize">{{ entry.mood }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(entry.created_at) }}</span>
                </div>
                <p v-if="entry.context" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {{ entry.context }}
                </p>
                <div class="mt-1 flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span>Energy: {{ entry.energy }}/10</span>
                  <span>Valence: {{ entry.valence.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
