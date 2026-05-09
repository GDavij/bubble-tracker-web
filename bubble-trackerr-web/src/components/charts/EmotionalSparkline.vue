<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import type { Mood } from '@/types/domain'

interface DataPoint {
  value: number
  mood: Mood
  date: string
}

const props = withDefaults(
  defineProps<{
    data: DataPoint[]
    metric?: 'energy' | 'valence'
  }>(),
  {
    metric: 'energy',
  },
)

const chartRef = ref<SVGSVGElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const moodColors: Record<Mood, string> = {
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

function drawChart() {
  if (!chartRef.value || !props.data.length) return

  const container = chartRef.value.parentElement
  if (!container) return

  const width = container.clientWidth || 200
  const height = 60

  d3.select(chartRef.value).selectAll('*').remove()

  const svg = d3
    .select(chartRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const values = props.data.map((d) => d.value)
  const minVal = Math.min(...values) - 0.1
  const maxVal = Math.max(...values) + 0.1
  const range = maxVal - minVal || 1

  const xScale = d3.scaleLinear().domain([0, props.data.length - 1]).range([0, width])
  const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height - 4, 4])

  const line = d3
    .line<DataPoint>()
    .x((_d, i) => xScale(i))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX)

  svg
    .append('path')
    .datum(props.data)
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.7)

  // Gradient area
  const area = d3
    .area<DataPoint>()
    .x((_d, i) => xScale(i))
    .y0(height)
    .y1((d) => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const gradient = svg
    .append('defs')
    .append('linearGradient')
    .attr('id', 'sparkline-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')

  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.2)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0)

  svg.append('path').datum(props.data).attr('d', area).attr('fill', 'url(#sparkline-gradient)')

  // Points colored by mood
  props.data.forEach((d, i) => {
    svg
      .append('circle')
      .attr('cx', xScale(i))
      .attr('cy', yScale(d.value))
      .attr('r', 2.5)
      .attr('fill', moodColors[d.mood] || '#9ca3af')
      .attr('stroke', '#111827')
      .attr('stroke-width', 1)
  })
}

onMounted(() => {
  drawChart()
  if (chartRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => drawChart())
    resizeObserver.observe(chartRef.value.parentElement)
  }
})

watch(() => props.data, drawChart, { deep: true })

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="w-full h-[60px]">
    <svg v-if="data.length" ref="chartRef" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-600">
      No data
    </div>
  </div>
</template>
