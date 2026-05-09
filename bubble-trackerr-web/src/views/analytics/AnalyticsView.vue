<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graph'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import * as d3 from 'd3'
import type { SocialRole } from '@/types/domain'

const router = useRouter()
const graphStore = useGraphStore()

const isLoading = ref(true)
const loadError = ref<string | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

const qualityLabels: Record<string, string> = {
  nourishing: 'Nourishing',
  neutral: 'Neutral',
  draining: 'Draining',
  conflicted: 'Conflicted',
  unknown: 'Unknown',
}

const qualityColors: Record<string, string> = {
  nourishing: '#10b981',
  neutral: '#6b7280',
  draining: '#ef4444',
  conflicted: '#f59e0b',
  unknown: '#9ca3af',
}

const roleColors: Record<string, string> = {
  bridge: '#f59e0b',
  mentor: '#3b82f6',
  anchor: '#10b981',
  catalyst: '#f97316',
  observer: '#94a3b8',
  drain: '#ef4444',
  unknown: '#6b7280',
}

const roleLabels: Record<string, string> = {
  bridge: 'Bridge',
  mentor: 'Mentor',
  anchor: 'Anchor',
  catalyst: 'Catalyst',
  observer: 'Observer',
  drain: 'Drain',
  unknown: 'Unknown',
}

// Stats from graph store snapshot
const snapshotStats = computed(() => graphStore.snapshot)

// Role distribution from graph nodes
const distribution = computed(() => {
  const dist: Record<string, number> = {}
  for (const node of graphStore.nodes) {
    const role = node.social_role
    dist[role] = (dist[role] ?? 0) + 1
  }
  return dist
})

// Top connections (top 5 edges by strength)
const topConnections = computed(() => {
  return [...graphStore.edges]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5)
})

// Quality breakdown
const qualityBreakdown = computed(() => {
  const breakdown: Record<string, number> = {
    nourishing: 0,
    neutral: 0,
    draining: 0,
    conflicted: 0,
    unknown: 0,
  }
  for (const edge of graphStore.edges) {
    const q = edge.quality
    breakdown[q] = (breakdown[q] ?? 0) + 1
  }
  return breakdown
})

// D3 donut chart for role distribution
function drawDonutChart() {
  if (!svgRef.value) return
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const data = Object.entries(distribution.value).filter(([, count]) => count > 0)
  if (data.length === 0) return

  const width = 280
  const height = 280
  const radius = Math.min(width, height) / 2 - 30

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`)

  const pie = d3.pie<[string, number]>().value((d) => d[1])
  const arc = d3
    .arc<d3.PieArcDatum<[string, number]>>()
    .innerRadius(radius * 0.55)
    .outerRadius(radius)

  const arcs = g
    .selectAll('path')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d) => roleColors[d.data[0]] || '#6b7280')
    .attr('stroke', '#111827')
    .attr('stroke-width', 2)
    .attr('opacity', 0.85)
    .on('mouseenter', function () {
      d3.select(this).attr('opacity', 1)
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', 0.85)
    })

  // Animate in
  arcs
    .transition()
    .duration(600)
    .attrTween('d', function (d) {
      const interpolate = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d)
      return (t: number) => arc(interpolate(t))!
    })

  // Legend
  const legend = g
    .selectAll('.legend')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (_, i) => `translate(${radius + 15}, ${-radius + i * 22})`)

  legend
    .append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('rx', 2)
    .attr('fill', (d) => roleColors[d[0]] || '#6b7280')

  legend
    .append('text')
    .attr('x', 16)
    .attr('y', 10)
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text((d) => `${roleLabels[d[0]] || d[0]}: ${d[1]}`)
}

// D3 bar chart for quality breakdown
function drawQualityChart() {
  const svgEl = document.getElementById('quality-chart') as SVGSVGElement | null
  if (!svgEl) return
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const data = Object.entries(qualityBreakdown.value).filter(([, count]) => count > 0)
  if (data.length === 0) return

  const margin = { top: 10, right: 10, bottom: 40, left: 100 }
  const width = 420
  const height = data.length * 44 + margin.top + margin.bottom

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d[1]) || 1])
    .range([0, width - margin.left - margin.right])

  const y = d3
    .scaleBand()
    .domain(data.map((d) => d[0]))
    .range([margin.top, height - margin.bottom])
    .padding(0.3)

  const g = svg.append('g').attr('transform', `translate(${margin.left},0)`)

  // Bars
  g.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('y', (d) => y(d[0])!)
    .attr('height', y.bandwidth())
    .attr('fill', (d) => qualityColors[d[0]] || '#6b7280')
    .attr('rx', 4)
    .attr('width', 0)
    .transition()
    .duration(600)
    .delay((_, i) => i * 80)
    .attr('width', (d) => x(d[1]))

  // Labels
  g.selectAll('.qlabel')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'qlabel')
    .attr('x', -8)
    .attr('y', (d) => y(d[0])! + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#d1d5db')
    .attr('font-size', '12px')
    .attr('text-anchor', 'end')
    .text((d) => qualityLabels[d[0]] || d[0])

  // Values
  g.selectAll('.qvalue')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'qvalue')
    .attr('x', (d) => x(d[1]) + 6)
    .attr('y', (d) => y(d[0])! + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text((d) => d[1])
}

// D3 horizontal bar chart for top connections
function drawConnectionsChart() {
  const svgEl = document.getElementById('connections-chart') as SVGSVGElement | null
  if (!svgEl) return
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const data = topConnections.value
  if (data.length === 0) return

  const margin = { top: 10, right: 60, bottom: 10, left: 120 }
  const width = 420
  const height = data.length * 44 + margin.top + margin.bottom

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const x = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0, width - margin.left - margin.right])

  const y = d3
    .scaleBand()
    .domain(data.map((_, i) => String(i)))
    .range([margin.top, height - margin.bottom])
    .padding(0.3)

  // Build a map of node id -> display name
  const nodeMap = new Map(graphStore.nodes.map((n) => [n.id, n.display_name]))

  const g = svg.append('g').attr('transform', `translate(${margin.left},0)`)

  // Bars
  g.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('y', (_, i) => y(String(i))!)
    .attr('height', y.bandwidth())
    .attr('fill', '#3b82f6')
    .attr('rx', 4)
    .attr('width', 0)
    .transition()
    .duration(600)
    .delay((_, i) => i * 80)
    .attr('width', (d) => x(d.strength))

  // Labels
  g.selectAll('.clabel')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'clabel')
    .attr('x', -8)
    .attr('y', (_, i) => y(String(i))! + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#d1d5db')
    .attr('font-size', '11px')
    .attr('text-anchor', 'end')
    .text((d) => {
      const src = nodeMap.get(d.source) || d.source.substring(0, 8)
      const tgt = nodeMap.get(d.target) || d.target.substring(0, 8)
      return `${src} → ${tgt}`
    })

  // Values
  g.selectAll('.cvalue')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'cvalue')
    .attr('x', (d) => x(d.strength) + 6)
    .attr('y', (_, i) => y(String(i))! + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text((d) => d.strength.toFixed(2))
}

watch(distribution, () => {
  drawDonutChart()
})

watch([qualityBreakdown, topConnections], () => {
  drawQualityChart()
  drawConnectionsChart()
})

async function loadData() {
  isLoading.value = true
  loadError.value = null
  try {
    await Promise.all([graphStore.fetchGraph(), graphStore.fetchSnapshot()])
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load analytics data'
  } finally {
    isLoading.value = false
  }
}

function navigateTo(path: string) {
  router.push(path)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white">Analytics</h1>
    </div>

    <!-- Loading state -->
    <template v-if="isLoading">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <BaseSkeleton variant="rectangular" height="4.5rem" />
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div v-for="i in 3" :key="i" class="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <BaseSkeleton variant="rectangular" height="12rem" />
        </div>
      </div>
    </template>

    <!-- Error state -->
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadData" />

    <!-- Content -->
    <template v-else>
      <!-- Snapshot Stats Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="Total People"
          :value="snapshotStats?.total_people ?? graphStore.nodes.length"
        />
        <StatCard
          icon="🔗"
          label="Total Relationships"
          :value="snapshotStats?.total_relationships ?? graphStore.edges.length"
        />
        <StatCard
          icon="🔄"
          label="Avg Reciprocity"
          :value="snapshotStats?.avg_reciprocity?.toFixed(3) ?? '—'"
        />
        <StatCard
          icon="🌉"
          label="Bridges"
          :value="snapshotStats?.bridge_count ?? '—'"
        />
      </div>

      <!-- Empty state if no data -->
      <EmptyState
        v-if="graphStore.nodes.length === 0 && graphStore.edges.length === 0"
        icon="📊"
        title="No analytics data yet"
        description="Add people and relationships to see analytics visualizations here."
      />

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Role Distribution Donut Chart -->
        <BaseCard padding="lg">
          <h2 class="text-lg font-semibold text-white mb-4">Role Distribution</h2>
          <div class="flex justify-center">
            <svg ref="svgRef" class="w-full max-w-[280px]" />
          </div>
        </BaseCard>

        <!-- Top Connections Bar Chart -->
        <BaseCard padding="lg">
          <h2 class="text-lg font-semibold text-white mb-4">Top Connections</h2>
          <div class="flex justify-center">
            <svg id="connections-chart" class="w-full" />
          </div>
          <EmptyState
            v-if="topConnections.length === 0"
            icon="🔗"
            title="No connections"
            description="Relationship data will appear here once you have connections."
          />
        </BaseCard>

        <!-- Quality Breakdown Bar Chart -->
        <BaseCard padding="lg">
          <h2 class="text-lg font-semibold text-white mb-4">Quality Breakdown</h2>
          <div class="flex justify-center">
            <svg id="quality-chart" class="w-full" />
          </div>
          <EmptyState
            v-if="Object.values(qualityBreakdown).every((v) => v === 0)"
            icon="🏷️"
            title="No quality data"
            description="Quality distribution will appear here once relationships are classified."
          />
        </BaseCard>
      </div>

      <!-- Quick Navigation -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
        <BaseCard padding="md" hoverable clickable @click="navigateTo('/analytics/roles')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg">
              🎭
            </div>
            <div>
              <div class="text-sm font-semibold text-white">Role Classifications</div>
              <div class="text-xs text-gray-400">View all role classifications</div>
            </div>
          </div>
        </BaseCard>

        <BaseCard padding="md" hoverable clickable @click="navigateTo('/analytics/profiles')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg">
              📋
            </div>
            <div>
              <div class="text-sm font-semibold text-white">Aggregated Profiles</div>
              <div class="text-xs text-gray-400">Ranked influence profiles</div>
            </div>
          </div>
        </BaseCard>

        <BaseCard padding="md" hoverable clickable @click="navigateTo('/analytics/snapshot')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">
              📸
            </div>
            <div>
              <div class="text-sm font-semibold text-white">Graph Snapshot</div>
              <div class="text-xs text-gray-400">Detailed network metrics</div>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
