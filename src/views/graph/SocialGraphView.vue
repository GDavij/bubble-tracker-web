<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import apiClient, { handleApiError } from '@/services/api'
import type { GraphData, GraphNode } from '@/types/graph'
import type { SocialRole, Quality, Mood } from '@/types/domain'
import { ROLE_COLORS, QUALITY_COLORS, MOOD_EMOJIS } from '@/utils/constants'
import { getRoleColor, getQualityColor, getMoodEmoji } from '@/utils/formatters'

const route = useRoute()

const loading = ref(true)
const error = ref('')

const graphData = ref<GraphData | null>(null)
const selectedNode = ref<GraphNode | null>(null)
const showDetailPanel = ref(false)
const showFilters = ref(true)
const isFullscreen = ref(false)

const searchQuery = ref('')
const roleFilter = ref<SocialRole | ''>('')
const qualityFilter = ref<Quality | ''>('')
const energyMin = ref(0)
const energyMax = ref(10)
const layoutType = ref<'force' | 'circular' | 'hierarchical'>('force')

const roles: SocialRole[] = ['bridge', 'mentor', 'anchor', 'catalyst', 'observer', 'drain', 'unknown']
const qualities: Quality[] = ['nourishing', 'neutral', 'draining', 'conflicted', 'unknown']

const filteredNodes = computed(() => {
  if (!graphData.value) return []
  return graphData.value.nodes.filter((node) => {
    if (searchQuery.value && !node.display_name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (roleFilter.value && node.social_role !== roleFilter.value) return false
    if (node.current_energy < energyMin.value || node.current_energy > energyMax.value) return false
    return true
  })
})

const filteredEdges = computed(() => {
  if (!graphData.value) return []
  return graphData.value.edges.filter((edge) => {
    if (qualityFilter.value && edge.quality !== qualityFilter.value) return false
    const sourceNode = graphData.value!.nodes.find((n) => n.id === edge.source)
    const targetNode = graphData.value!.nodes.find((n) => n.id === edge.target)
    if (sourceNode && (sourceNode.current_energy < energyMin.value || sourceNode.current_energy > energyMax.value)) return false
    if (targetNode && (targetNode.current_energy < energyMin.value || targetNode.current_energy > energyMax.value)) return false
    return true
  })
})

function selectNode(node: GraphNode) {
  selectedNode.value = node
  showDetailPanel.value = true
}

function closeDetailPanel() {
  showDetailPanel.value = false
  selectedNode.value = null
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function getNodeColor(node: GraphNode): string {
  return (ROLE_COLORS[node.social_role] ?? ROLE_COLORS['unknown'])!
}

function getEdgeColor(edge: { quality: Quality }): string {
  return (QUALITY_COLORS[edge.quality] ?? QUALITY_COLORS['unknown'])!
}

async function fetchGraph() {
  error.value = ''
  try {
    const res = await apiClient.get<GraphData>('/graph/full')
    graphData.value = res.data
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchGraph()
})
</script>

<template>
  <div
    class="flex h-screen flex-col bg-gray-50 dark:bg-gray-900"
    :class="{ 'fixed inset-0 z-50': isFullscreen }"
  >
    <!-- Top bar -->
    <header class="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Social Graph</h1>
      <div class="flex items-center gap-2">
        <button
          class="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          @click="showFilters = !showFilters"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        <button
          class="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          @click="toggleFullscreen"
        >
          <svg v-if="!isFullscreen" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Main graph area -->
      <main class="relative flex-1">
        <!-- Loading state -->
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <svg class="mx-auto h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading graph...</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex h-full items-center justify-center">
          <div class="text-center">
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
            <button
              class="mt-2 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              @click="fetchGraph"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Graph canvas placeholder -->
        <div v-else-if="graphData" class="h-full w-full">
          <!-- ForceGraph component slot -->
          <div class="relative h-full w-full bg-gray-100 dark:bg-gray-800">
            <!-- Nodes rendered as positioned elements -->
            <svg class="absolute inset-0 h-full w-full">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" class="fill-gray-300 dark:fill-gray-600" />
                </marker>
              </defs>
              <!-- Edges -->
              <line
                v-for="(edge, idx) in filteredEdges"
                :key="`edge-${idx}`"
                :x1="getNodePosition(edge.source).x"
                :y1="getNodePosition(edge.source).y"
                :x2="getNodePosition(edge.target).x"
                :y2="getNodePosition(edge.target).y"
                :stroke="getEdgeColor(edge)"
                :stroke-width="Math.max(1, edge.strength * 4)"
                stroke-opacity="0.4"
                marker-end="url(#arrowhead)"
              />
            </svg>
            <!-- Nodes -->
            <div
              v-for="node in filteredNodes"
              :key="node.id"
              class="absolute cursor-pointer rounded-full border-2 border-white bg-gray-800 shadow-lg transition-transform hover:scale-110 dark:border-gray-600 dark:bg-gray-200"
              :style="{
                left: `${getNodePosition(node.id).x - 16}px`,
                top: `${getNodePosition(node.id).y - 16}px`,
                width: '32px',
                height: '32px',
                backgroundColor: getNodeColor(node),
              }"
              :title="node.display_name"
              @click="selectNode(node)"
            />
            <!-- Node labels -->
            <div
              v-for="node in filteredNodes"
              :key="`label-${node.id}`"
              class="absolute pointer-events-none text-xs text-gray-700 dark:text-gray-300"
              :style="{
                left: `${getNodePosition(node.id).x + 20}px`,
                top: `${getNodePosition(node.id).y - 6}px`,
              }"
            >
              {{ node.display_name }}
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex h-full items-center justify-center">
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">No graph data available</p>
            <router-link to="/analysis" class="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Analyze your first interaction
            </router-link>
          </div>
        </div>

        <!-- Legend -->
        <div class="absolute bottom-4 right-4 rounded-lg bg-white/90 p-3 shadow-sm ring-1 ring-gray-900/5 backdrop-blur dark:bg-gray-800/90 dark:ring-white/10">
          <p class="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Roles</p>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <div v-for="role in roles.filter(r => r !== 'unknown')" :key="role" class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: ROLE_COLORS[role] }" />
              <span class="text-xs capitalize text-gray-600 dark:text-gray-400">{{ role }}</span>
            </div>
          </div>
          <p class="mb-2 mt-3 text-xs font-semibold text-gray-700 dark:text-gray-300">Quality</p>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <div v-for="q in qualities.filter(q => q !== 'unknown')" :key="q" class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: QUALITY_COLORS[q] }" />
              <span class="text-xs capitalize text-gray-600 dark:text-gray-400">{{ q }}</span>
            </div>
          </div>
        </div>
      </main>

      <!-- Filter drawer -->
      <aside
        v-if="showFilters"
        class="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Filters</h2>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search people..."
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Role</label>
          <select
            v-model="roleFilter"
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All roles</option>
            <option v-for="role in roles" :key="role" :value="role" class="capitalize">{{ role }}</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Quality</label>
          <select
            v-model="qualityFilter"
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All qualities</option>
            <option v-for="q in qualities" :key="q" :value="q" class="capitalize">{{ q }}</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Energy: {{ energyMin }} - {{ energyMax }}
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="energyMin"
              type="range"
              min="0"
              max="10"
              step="1"
              class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 dark:bg-gray-600"
            />
            <input
              v-model.number="energyMax"
              type="range"
              min="0"
              max="10"
              step="1"
              class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 dark:bg-gray-600"
            />
          </div>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Layout</label>
          <div class="grid grid-cols-3 gap-1">
            <button
              v-for="layout in (['force', 'circular', 'hierarchical'] as const)"
              :key="layout"
              class="rounded-md px-2 py-1 text-xs capitalize"
              :class="layoutType === layout
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'"
              @click="layoutType = layout"
            >
              {{ layout }}
            </button>
          </div>
        </div>
      </aside>

      <!-- Node detail slide-in panel -->
      <aside
        v-if="showDetailPanel && selectedNode"
        class="w-[400px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Person Details</h2>
          <button
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            @click="closeDetailPanel"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Person info -->
        <div class="mb-4 flex items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
            :style="{ backgroundColor: getNodeColor(selectedNode) }"
          >
            {{ selectedNode.display_name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ selectedNode.display_name }}</h3>
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              :style="{ backgroundColor: getNodeColor(selectedNode) + '20', color: getNodeColor(selectedNode) }"
            >
              {{ selectedNode.social_role }}
            </span>
          </div>
        </div>

        <!-- Metrics summary -->
        <div class="mb-4 grid grid-cols-2 gap-3">
          <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">Mood</p>
            <p class="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
              {{ getMoodEmoji(selectedNode.current_mood) }} {{ selectedNode.current_mood }}
            </p>
          </div>
          <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">Energy</p>
            <div class="mt-0.5 flex items-center gap-2">
              <div class="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  class="h-1.5 rounded-full bg-blue-500"
                  :style="{ width: `${(selectedNode.current_energy / 10) * 100}%` }"
                />
              </div>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ selectedNode.current_energy }}</span>
            </div>
          </div>
          <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">Interactions</p>
            <p class="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{{ selectedNode.interaction_count }}</p>
          </div>
        </div>

        <!-- Relationships list -->
        <div class="mb-4">
          <h3 class="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Relationships</h3>
          <div v-if="graphData" class="space-y-2">
            <div
              v-for="edge in graphData.edges.filter(e => selectedNode && (e.source === selectedNode.id || e.target === selectedNode.id))"
              :key="edge.source + edge.target"
              class="flex items-center gap-2 rounded-md bg-gray-50 p-2 dark:bg-gray-700"
            >
              <span
                class="h-2 w-2 rounded-full"
                :style="{ backgroundColor: QUALITY_COLORS[edge.quality] }"
              />
              <span class="flex-1 text-xs text-gray-700 dark:text-gray-300">
                {{ edge.source === selectedNode.id ? edge.target : edge.source }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ (edge.strength * 100).toFixed(0) }}%</span>
            </div>
          </div>
          <p v-else class="text-xs text-gray-400 dark:text-gray-500">No relationships found</p>
        </div>

        <!-- View profile link -->
        <router-link
          :to="`/people/${selectedNode.id}`"
          class="block w-full rounded-md bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          View Full Profile
        </router-link>
      </aside>
    </div>
  </div>
</template>

<script lang="ts">
function getNodePosition(idOrEdge: string): { x: number; y: number } {
  // Simple deterministic positioning based on string hash
  let hash = 0
  for (let i = 0; i < idOrEdge.length; i++) {
    const char = idOrEdge.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  const x = 100 + (Math.abs(hash) % 600)
  const y = 80 + (Math.abs(hash * 7) % 400)
  return { x, y }
}

export default {
  methods: {
    getNodePosition,
  },
}
</script>
