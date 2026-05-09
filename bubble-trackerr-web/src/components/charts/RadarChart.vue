<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import type { CentralityScores } from '@/types/domain'

const props = defineProps<{
  scores: CentralityScores
}>()

const chartRef = ref<SVGSVGElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const axes = [
  { key: 'degree', label: 'Degree' },
  { key: 'betweenness', label: 'Betweenness' },
  { key: 'closeness', label: 'Closeness' },
  { key: 'eigenvector', label: 'Eigenvector' },
  { key: 'pagerank', label: 'PageRank' },
  { key: 'clustering_coef', label: 'Clustering' },
]

function drawChart() {
  if (!chartRef.value) return

  const container = chartRef.value.parentElement
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight || 300
  const size = Math.min(width, height)
  const radius = size / 2 - 50

  d3.select(chartRef.value).selectAll('*').remove()

  const svg = d3
    .select(chartRef.value)
    .attr('width', width)
    .attr('height', height)

  const g = svg
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const angleSlice = (Math.PI * 2) / axes.length
  const maxVal = d3.max(axes, (d) => props.scores[d.key as keyof CentralityScores] as number) || 1

  const rScale = d3.scaleLinear().domain([0, maxVal]).range([0, radius])

  // Grid circles
  const gridLevels = 5
  for (let i = 1; i <= gridLevels; i++) {
    g.append('circle')
      .attr('r', (radius / gridLevels) * i)
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2')
  }

  // Axis lines and labels
  axes.forEach((axis, i) => {
    const angle = angleSlice * i - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', '#374151')
      .attr('stroke-width', 0.5)

    const labelRadius = radius + 20
    const lx = Math.cos(angle) * labelRadius
    const ly = Math.sin(angle) * labelRadius

    g.append('text')
      .attr('x', lx)
      .attr('y', ly)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .text(axis.label)
  })

  // Data polygon
  const points = axes.map((axis, i) => {
    const angle = angleSlice * i - Math.PI / 2
    const value = props.scores[axis.key as keyof CentralityScores] as number
    const r = rScale(value)
    return [Math.cos(angle) * r, Math.sin(angle) * r]
  })

  const line = d3.line<(number | undefined)[]>()
    .x((d) => d[0] ?? 0)
    .y((d) => d[1] ?? 0)

  g.append('path')
    .datum(points)
    .attr('d', line as unknown as string)
    .attr('fill', 'rgba(59, 130, 246, 0.15)')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 2)

  // Data points
  points.forEach((point) => {
    g.append('circle')
      .attr('cx', point[0]!)
      .attr('cy', point[1]!)
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 2)
  })
}

onMounted(() => {
  drawChart()

  if (chartRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => {
      drawChart()
    })
    resizeObserver.observe(chartRef.value.parentElement)
  }
})

watch(() => props.scores, drawChart, { deep: true })

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div class="w-full h-full min-h-[250px]">
    <svg ref="chartRef" class="w-full h-full" />
  </div>
</template>
