import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { graphService } from '@/services/graph.service'
import type { GraphNode, GraphEdge, GraphStats, FullGraphData, GraphSnapshot } from '@/types/graph'

interface GraphFilters {
  roles: string[]
  moods: string[]
  minStrength: number
  search: string
}

export const useGraphStore = defineStore('graph', () => {
  const nodes = ref<GraphNode[]>([])
  const edges = ref<GraphEdge[]>([])
  const stats = ref<GraphStats | null>(null)
  const fullData = ref<FullGraphData | null>(null)
  const snapshot = ref<GraphSnapshot | null>(null)
  const selectedNode = ref<string | null>(null)
  const filters = ref<GraphFilters>({
    roles: [],
    moods: [],
    minStrength: 0,
    search: '',
  })
  const layout = ref<string>('force')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const filteredNodes = computed(() => {
    let result = nodes.value
    const f = filters.value

    if (f.roles.length > 0) {
      result = result.filter((node) => f.roles.includes(node.social_role))
    }

    if (f.moods.length > 0) {
      result = result.filter((node) => f.moods.includes(node.current_mood))
    }

    if (f.search) {
      const searchLower = f.search.toLowerCase()
      result = result.filter((node) => node.display_name.toLowerCase().includes(searchLower))
    }

    return result
  })

  const filteredEdges = computed(() => {
    const nodeIds = new Set(filteredNodes.value.map((n) => n.id))
    let result = edges.value.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    )

    if (filters.value.minStrength > 0) {
      result = result.filter((edge) => edge.strength >= filters.value.minStrength)
    }

    return result
  })

  const roleDistribution = computed(() => {
    const distribution: Record<string, number> = {}
    for (const node of nodes.value) {
      const role = node.social_role
      distribution[role] = (distribution[role] ?? 0) + 1
    }
    return distribution
  })

  async function fetchGraph() {
    isLoading.value = true
    error.value = null
    try {
      const data = await graphService.getGraph()
      nodes.value = data.nodes
      edges.value = data.edges
      stats.value = data.stats
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch graph'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchFullGraph() {
    isLoading.value = true
    error.value = null
    try {
      const data = await graphService.getFullGraph()
      fullData.value = data
      nodes.value = data.graph.nodes
      edges.value = data.graph.edges
      stats.value = data.graph.stats
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch full graph'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSnapshot() {
    error.value = null
    try {
      snapshot.value = await graphService.getSnapshot()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch snapshot'
      error.value = message
      throw err
    }
  }

  function selectNode(nodeId: string | null) {
    selectedNode.value = nodeId
  }

  function setFilters(newFilters: Partial<GraphFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function setLayout(newLayout: string) {
    layout.value = newLayout
  }

  return {
    nodes,
    edges,
    stats,
    fullData,
    snapshot,
    selectedNode,
    filters,
    layout,
    isLoading,
    error,
    filteredNodes,
    filteredEdges,
    roleDistribution,
    fetchGraph,
    fetchFullGraph,
    fetchSnapshot,
    selectNode,
    setFilters,
    setLayout,
  }
})
