<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import type { PersonState, Mood } from '@/types/domain'

const props = withDefaults(
  defineProps<{
    states: PersonState[]
    metric?: 'energy' | 'valence' | 'mood'
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

const moodYPositions: Record<Mood, number> = {
  happy: 5,
  energized: 4,
  hopeful: 3,
  grateful: 2,
  neutral: 1,
  anxious: 0,
  tired: -1,
  sad: -2,
  lonely: -3,
  angry: -4,
}

function drawChart() {
  if (!chartRef.value || !props.states.length) return

  const container = chartRef.value.parentElement
  if (!container) return

  const margin = { top: 20, right: 30, bottom: 40, left: 50 }
  const width = container.clientWidth - margin.left - margin.right
  const height = Math.max(200, (container.clientHeight || 300) - margin.top - margin.bottom)

  d3.select(chartRef.value).selectAll('*').remove()

  const svg = d3
    .select(chartRef.value)
    .attr('width', container.clientWidth)
    .attr('height', container.clientHeight || 300)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const parsedData = props.states
    .map((s) => ({
      ...s,
      date: new Date(s.created_at),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const xScale = d3.scaleTime().domain(d3.extent(parsedData, (d) => d.date) as [Date, Date]).range([0, width])

  if (props.metric === 'mood') {
    // Categorical mood chart
    const yScale = d3.scaleLinear().domain([-5, 6]).range([height, 0])

    // Y axis with mood labels
    const yAxis = d3.axisLeft(yScale).ticks(10).tickSize(-width).tickFormat((d) => {
      const val = d as number
      const entry = Object.entries(moodYPositions).find(([, v]) => v === val)
      return entry ? entry[0] : ''
    })
    svg.append('g').attr('class', 'y-axis').call(yAxis)
      .selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
    svg.selectAll('.y-axis .tick line').attr('stroke', '#1f2937')

    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(5)
    svg.append('g').attr('transform', `translate(0,${height})`).call(xAxis)
      .selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
    svg.selectAll('.domain').attr('stroke', '#374151')

    // Mood dots
    svg
      .selectAll('.mood-dot')
      .data(parsedData)
      .join('circle')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(moodYPositions[d.mood] ?? 0))
      .attr('r', 5)
      .attr('fill', (d) => moodColors[d.mood])
      .attr('stroke', '#111827')
      .attr('stroke-width', 1.5)
  } else {
    // Energy or valence line chart
    const metricKey = props.metric
    const values = parsedData.map((d) => d[metricKey] as number)
    const minVal = Math.min(...values) - 0.1
    const maxVal = Math.max(...values) + 0.1

    const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0])

    // Grid
    const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-width)
    svg.append('g').call(yAxis)
      .selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
    svg.selectAll('.y-axis .tick line').attr('stroke', '#1f2937')

    const xAxis = d3.axisBottom(xScale).ticks(5)
    svg.append('g').attr('transform', `translate(0,${height})`).call(xAxis)
      .selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
    svg.selectAll('.domain').attr('stroke', '#374151')

    // Area
    const area = d3
      .area<typeof parsedData[number]>()
      .x((d) => xScale(d.date))
      .y0(height)
      .y1((d) => yScale(d[metricKey] as number))
      .curve(d3.curveMonotoneX)

    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'timeline-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.2)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0)

    svg.append('path').datum(parsedData).attr('d', area).attr('fill', 'url(#timeline-area-gradient)')

    // Line
    const line = d3
      .line<typeof parsedData[number]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d[metricKey] as number))
      .curve(d3.curveMonotoneX)

    svg.append('path').datum(parsedData).attr('d', line).attr('fill', 'none').attr('stroke', '#3b82f6').attr('stroke-width', 2)

    // Dots colored by mood
    svg
      .selectAll('.data-dot')
      .data(parsedData)
      .join('circle')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d[metricKey] as number))
      .attr('r', 4)
      .attr('fill', (d) => moodColors[d.mood])
      .attr('stroke', '#111827')
      .attr('stroke-width', 1.5)

    // Tooltip
    const tooltip = d3.select(chartRef.value.parentElement)
      .append('div')
      .attr('class', 'timeline-tooltip')
      .style('position', 'absolute')
      .style('background', '#1f2937')
      .style('border', '1px solid #374151')
      .style('border-radius', '8px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('color', '#e5e7eb')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '10')

    svg
      .selectAll('.hover-area')
      .data(parsedData)
      .join('rect')
      .attr('x', (d) => xScale(d.date) - 10)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mouseover', function (event, d) {
        tooltip.style('opacity', '1').html(`
          <div style="font-weight:600;margin-bottom:2px">${d.person_name || 'Unknown'}</div>
          <div>${metricKey}: ${(d[metricKey] as number).toFixed(2)}</div>
          <div>Mood: ${d.mood}</div>
          <div style="color:#6b7280">${d.date.toLocaleDateString()}</div>
        `)
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`)
      })
      .on('mouseout', function () {
        tooltip.style('opacity', '0')
      })
  }
}

onMounted(() => {
  drawChart()
  if (chartRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => drawChart())
    resizeObserver.observe(chartRef.value.parentElement)
  }
})

watch(() => [props.states, props.metric], drawChart, { deep: true })

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="relative w-full h-full min-h-[300px]">
    <svg v-if="states.length" ref="chartRef" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center text-sm text-gray-600">
      No timeline data
    </div>
  </div>
</template>
