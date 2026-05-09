import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGraphStore } from '@/stores/graph'
import type { GraphNode, GraphEdge, GraphSnapshot, GraphData } from '@/types/graph'

// Mock graph service
vi.mock('@/services/graph.service', () => ({
  graphService: {
    getGraph: vi.fn(),
    getFullGraph: vi.fn(),
    getSnapshot: vi.fn(),
  }
}))

const mockNodes: GraphNode[] = [
  { id: '1', display_name: 'Alice', social_role: 'bridge', current_mood: 'happy', current_energy: 0.8, interaction_count: 15 },
  { id: '2', display_name: 'Bob', social_role: 'mentor', current_mood: 'neutral', current_energy: 0.6, interaction_count: 10 },
  { id: '3', display_name: 'Charlie', social_role: 'anchor', current_mood: 'anxious', current_energy: 0.4, interaction_count: 8 },
  { id: '4', display_name: 'Diana', social_role: 'bridge', current_mood: 'energized', current_energy: 0.9, interaction_count: 20 },
]

const mockEdges: GraphEdge[] = [
  { source: '1', target: '2', quality: 'nourishing', strength: 0.9, source_weight: 0.8, target_weight: 0.7, protocol: 'deep', reciprocity_index: 0.85 },
  { source: '2', target: '3', quality: 'neutral', strength: 0.5, source_weight: 0.5, target_weight: 0.5, protocol: 'casual', reciprocity_index: 0.5 },
  { source: '3', target: '4', quality: 'draining', strength: 0.3, source_weight: 0.4, target_weight: 0.6, protocol: 'digital', reciprocity_index: 0.2 },
  { source: '1', target: '4', quality: 'nourishing', strength: 0.8, source_weight: 0.9, target_weight: 0.7, protocol: 'deep', reciprocity_index: 0.75 },
]

function mockGraphData(): GraphData {
  return {
    user_id: 'test-user',
    nodes: mockNodes,
    edges: mockEdges,
    stats: { total_people: 4, total_relationships: 4, avg_reciprocity: 0.575, bridge_count: 2, strongest_connection: 'Alice ↔ Bob' },
  }
}

const mockSnapshot: GraphSnapshot = {
  total_people: 4,
  total_relationships: 4,
  avg_reciprocity: 0.575,
  bridge_count: 2,
  strongest_connection: 'Alice ↔ Bob',
  network_density: 0.667,
  avg_clustering: 0.42,
  community_count: 2,
}

describe('GraphStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty nodes and edges', () => {
    const store = useGraphStore()
    expect(store.nodes).toEqual([])
    expect(store.edges).toEqual([])
    expect(store.stats).toBeNull()
    expect(store.snapshot).toBeNull()
    expect(store.selectedNode).toBeNull()
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchGraph sets nodes and edges', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getGraph).mockResolvedValue(mockGraphData())

    const store = useGraphStore()
    await store.fetchGraph()

    expect(store.nodes).toHaveLength(4)
    expect(store.edges).toHaveLength(4)
    expect(store.stats?.total_people).toBe(4)
    expect(store.isLoading).toBe(false)
  })

  it('fetchSnapshot sets snapshot data', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getSnapshot).mockResolvedValue(mockSnapshot)

    const store = useGraphStore()
    await store.fetchSnapshot()

    expect(store.snapshot).toEqual(mockSnapshot)
    expect(store.snapshot?.total_people).toBe(4)
    expect(store.snapshot?.network_density).toBe(0.667)
    expect(store.snapshot?.community_count).toBe(2)
  })

  it('selectedNode getter returns correct value', () => {
    const store = useGraphStore()
    expect(store.selectedNode).toBeNull()

    store.selectNode('1')
    expect(store.selectedNode).toBe('1')

    store.selectNode(null)
    expect(store.selectedNode).toBeNull()
  })

  it('filteredNodes filters by role', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getGraph).mockResolvedValue(mockGraphData())

    const store = useGraphStore()
    await store.fetchGraph()

    store.setFilters({ roles: ['bridge'] })
    expect(store.filteredNodes).toHaveLength(2)
    expect(store.filteredNodes.every((n) => n.social_role === 'bridge')).toBe(true)

    store.setFilters({ roles: ['bridge', 'mentor'] })
    expect(store.filteredNodes).toHaveLength(3)
  })

  it('filteredNodes filters by search string', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getGraph).mockResolvedValue(mockGraphData())

    const store = useGraphStore()
    await store.fetchGraph()

    store.setFilters({ search: 'alice' })
    expect(store.filteredNodes).toHaveLength(1)
    expect(store.filteredNodes[0]!.display_name).toBe('Alice')

    store.setFilters({ search: 'zzz' })
    expect(store.filteredNodes).toHaveLength(0)
  })

  it('filters edges based on filtered nodes', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getGraph).mockResolvedValue(mockGraphData())

    const store = useGraphStore()
    await store.fetchGraph()

    store.setFilters({ roles: ['bridge'] })
    expect(store.filteredEdges).toHaveLength(1)
  })

  it('filters edges by min strength', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getGraph).mockResolvedValue(mockGraphData())

    const store = useGraphStore()
    await store.fetchGraph()

    store.setFilters({ minStrength: 0.8 })
    expect(store.filteredEdges).toHaveLength(2)
    expect(store.filteredEdges.every((e) => e.strength >= 0.8)).toBe(true)
  })

  it('roleDistribution computed aggregates correctly', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getGraph).mockResolvedValue(mockGraphData())

    const store = useGraphStore()
    await store.fetchGraph()

    const dist = store.roleDistribution
    expect(dist['bridge']).toBe(2)
    expect(dist['mentor']).toBe(1)
    expect(dist['anchor']).toBe(1)
  })

  it('handles fetch failure gracefully', async () => {
    const { graphService } = await import('@/services/graph.service')
    vi.mocked(graphService.getGraph).mockRejectedValue(new Error('Network error'))

    const store = useGraphStore()
    await expect(store.fetchGraph()).rejects.toThrow('Network error')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('Network error')
  })

  it('setLayout changes layout string', () => {
    const store = useGraphStore()
    expect(store.layout).toBe('force')

    store.setLayout('radial')
    expect(store.layout).toBe('radial')
  })

  it('resets filters correctly', () => {
    const store = useGraphStore()
    store.setFilters({ roles: ['bridge'], search: 'test', minStrength: 0.5 })
    expect(store.filters.roles).toEqual(['bridge'])
    expect(store.filters.search).toBe('test')
    expect(store.filters.minStrength).toBe(0.5)

    // Reset roles
    store.setFilters({ roles: [] })
    expect(store.filters.roles).toEqual([])
    expect(store.filters.search).toBe('test') // Other filters preserved
  })
})
