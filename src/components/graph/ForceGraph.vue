<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '@/types/graph'
import type { SocialRole, Mood, Quality } from '@/types/domain'

const props = withDefaults(
  defineProps<{
    nodes: GraphNode[]
    edges: GraphEdge[]
    width: number
    height: number
    selectedNodeId?: string
  }>(),
  {
    selectedNodeId: undefined,
  },
)

const emit = defineEmits<{
  nodeClick: [node: GraphNode]
  nodeHover: [node: GraphNode | null]
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
let resizeObserver: ResizeObserver | null = null

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

  const w = props.width
  const h = props.height

  svg.attr('viewBox', `0 0 ${w} ${h}`)

  // Container for zoom/pan
  const container = svg.append('g')

  // Zoom behavior
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 4])
    .on('zoom', (event) => {
      container.attr('transform', event.transform)
    })

  svg.call(zoom)

  // Build simulation data
  const simNodes: SimNode[] = props.nodes.map((n) => ({ ...n }))
  const simLinks: SimLink[] = props.edges.map((e) => ({
    ...e,
    source: e.source,
    target: e.target,
  }))

  // Create arrow markers
  const defs = svg.append('defs')
  Object.entries(qualityColors).forEach(([quality, color]) => {
    defs
      .append('marker')
      .attr('id', `arrow-${quality}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', color)
      .attr('d', 'M0,-5L10,0L0,5')
  })

  // Create link elements
  const link = container
    .append('g')
    .selectAll('line')
    .data(simLinks)
    .join('line')
    .attr('stroke', (d) => qualityColors[d.quality] || '#374151')
    .attr('stroke-width', (d) => Math.max(1, (d.strength ?? 0.5) * 4))
    .attr('stroke-opacity', 0.6)
    .attr('marker-end', (d) => `url(#arrow-${d.quality})`)

  // Create node groups
  const nodeGroup = container
    .append('g')
    .selectAll<SVGGElement, SimNode>('g')
    .data(simNodes)
    .join('g')
    .attr('cursor', 'pointer')
    .call(
      d3.drag<SVGGElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation?.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation?.alphaTarget(0)
          d.fx = null
          d.fy = null
        }),
    )

  // Node circles
  nodeGroup
    .append('circle')
    .attr('r', (d) => Math.max(8, Math.min(25, 8 + (d.interaction_count ?? 0) * 0.5)))
    .attr('fill', (d) => roleColors[d.social_role] || '#6b7280')
    .attr('stroke', (d) => moodBorderColors[d.current_mood] || '#374151')
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.8)

  // Node labels
  nodeGroup
    .append('text')
    .text((d) => d.display_name)
    .attr('text-anchor', 'middle')
    .attr('dy', (d) => -(Math.max(8, Math.min(25, 8 + (d.interaction_count ?? 0) * 0.5)) + 8))
    .attr('fill', '#d1d5db')
    .attr('font-size', '10px')
    .attr('pointer-events', 'none')

  // Hover behavior
  nodeGroup
    .on('mouseenter', (event, d) => {
      emit('nodeHover', d)
      // Highlight connected
      const connectedIds = new Set<string>()
      simLinks.forEach((l) => {
        const src = l.source as SimNode
        const tgt = l.target as SimNode
        if (src.id === d.id) connectedIds.add(tgt.id)
        if (tgt.id === d.id) connectedIds.add(src.id)
      })

      nodeGroup.attr('opacity', (n) => (n.id === d.id || connectedIds.has(n.id) ? 1 : 0.15))
      link.attr('stroke-opacity', (l) => {
        const src = l.source as SimNode
        const tgt = l.target as SimNode
        return src.id === d.id || tgt.id === d.id ? 0.8 : 0.05
      })
    })
    .on('mouseleave', () => {
      emit('nodeHover', null)
      nodeGroup.attr('opacity', 1)
      link.attr('stroke-opacity', 0.6)
    })
    .on('click', (_event, d) => {
      emit('nodeClick', d)
    })

  // Force simulation
  simulation = d3
    .forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      d3
        .forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(80),
    )
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force('collide', d3.forceCollide<SimNode>().radius((d) => Math.max(8, Math.min(25, 8 + (d.interaction_count ?? 0) * 0.5)) + 5))

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => (d.source as SimNode).x ?? 0)
      .attr('y1', (d) => (d.source as SimNode).y ?? 0)
      .attr('x2', (d) => (d.target as SimNode).x ?? 0)
      .attr('y2', (d) => (d.target as SimNode).y ?? 0)

    nodeGroup.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
  })

  // Legend
  const legend = svg
    .append('g')
    .attr('transform', `translate(${w - 150}, 16)`)

  const legendRoles: Array<{ role: SocialRole; label: string }> = [
    { role: 'bridge', label: 'Bridge' },
    { role: 'mentor', label: 'Mentor' },
    { role: 'anchor', label: 'Anchor' },
    { role: 'catalyst', label: 'Catalyst' },
    { role: 'observer', label: 'Observer' },
    { role: 'drain', label: 'Drain' },
  ]

  legendRoles.forEach((item, i) => {
    const y = i * 18
    legend
      .append('circle')
      .attr('cx', 6)
      .attr('cy', y)
      .attr('r', 5)
      .attr('fill', roleColors[item.role])
    legend
      .append('text')
      .attr('x', 16)
      .attr('y', y + 4)
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .text(item.label)
  })
}

onMounted(() => {
  buildGraph()
  if (svgRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => buildGraph())
    resizeObserver.observe(svgRef.value.parentElement)
  }
})

watch(
  () => [props.nodes, props.edges, props.selectedNodeId],
  () => buildGraph(),
  { deep: true },
)

onUnmounted(() => {
  destroy()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="relative w-full h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
    <svg
      v-if="nodes.length"
      ref="svgRef"
      class="w-full h-full"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-sm text-gray-600">
      No graph data
    </div>
  </div>
</template>
