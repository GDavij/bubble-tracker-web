<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '@/types/graph'
import type { SocialRole, Mood, Quality } from '@/types/domain'

const props = defineProps<{
  nodes: GraphNode[]
  edges: GraphEdge[]
}>()

const svgRef = ref<SVGSVGElement | null>(null)

type SimNode = d3.SimulationNodeDatum & GraphNode
type SimLink = d3.SimulationLinkDatum<SimNode> & GraphEdge

const roleColors: Record<SocialRole, string> = {
  bridge: '#f59e0b',
  mentor: '#3b82f6',
  anchor: '#10b981',
  catalyst: '#f97316',
  observer: '#94a3b8',
  drain: '#ef4444',
  unknown: '#6b7280',
}

const moodBorderColors: Record<Mood, string> = {
  happy: '#22c55e',
  anxious: '#eab308',
  tired: '#6b7280',
  energized: '#06b6d4',
  sad: '#3b82f6',
  neutral: '#9ca3af',
  angry: '#ef4444',
  hopeful: '#a855f7',
  lonely: '#6366f1',
  grateful: '#ec4899',
}

const qualityColors: Record<Quality, string> = {
  nourishing: '#22c55e',
  neutral: '#6b7280',
  draining: '#ef4444',
  conflicted: '#eab308',
  unknown: '#374151',
}

let simulation: d3.Simulation<SimNode, SimLink> | null = null

const WIDTH = 250
const HEIGHT = 200

function destroy() {
  if (simulation) {
    simulation.stop()
    simulation = null
  }
  if (svgRef.value) {
    d3.select(svgRef.value).selectAll('*').remove()
  }
}

function buildGraph() {
  if (!svgRef.value || !props.nodes.length) return

  destroy()

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const container = svg.append('g')

  const simNodes: SimNode[] = props.nodes.map((n) => ({ ...n }))
  const simLinks: SimLink[] = props.edges.map((e) => ({
    ...e,
    source: e.source,
    target: e.target,
  }))

  // Links
  const link = container
    .append('g')
    .selectAll('line')
    .data(simLinks)
    .join('line')
    .attr('stroke', (d) => qualityColors[d.quality] || '#374151')
    .attr('stroke-width', (d) => Math.max(0.5, (d.strength ?? 0.5) * 2))
    .attr('stroke-opacity', 0.4)

  // Node groups
  const nodeGroup = container
    .append('g')
    .selectAll<SVGGElement, SimNode>('g')
    .data(simNodes)
    .join('g')

  nodeGroup
    .append('circle')
    .attr('r', (d) => Math.max(4, Math.min(14, 4 + (d.interaction_count ?? 0) * 0.3)))
    .attr('fill', (d) => roleColors[d.social_role] || '#6b7280')
    .attr('stroke', (d) => moodBorderColors[d.current_mood] || '#374151')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.7)

  // Simulation (no drag - read-only)
  simulation = d3
    .forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      d3
        .forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(50),
    )
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(WIDTH / 2, HEIGHT / 2))
    .force('collide', d3.forceCollide<SimNode>().radius((d) => Math.max(4, Math.min(14, 4 + (d.interaction_count ?? 0) * 0.3)) + 3))

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => (d.source as SimNode).x ?? 0)
      .attr('y1', (d) => (d.source as SimNode).y ?? 0)
      .attr('x2', (d) => (d.target as SimNode).x ?? 0)
      .attr('y2', (d) => (d.target as SimNode).y ?? 0)

    nodeGroup.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
  })
}

onMounted(() => {
  buildGraph()
})

watch(() => [props.nodes, props.edges], () => buildGraph(), { deep: true })

onUnmounted(() => {
  destroy()
})
</script>

<template>
  <div class="w-[250px] h-[200px] bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
    <svg
      v-if="nodes.length"
      ref="svgRef"
      :width="WIDTH"
      :height="HEIGHT"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="w-full h-full"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-600">
      No data
    </div>
  </div>
</template>
