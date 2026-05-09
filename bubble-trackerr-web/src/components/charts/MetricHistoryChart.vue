<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'

export interface MetricPoint {
  date: string
  value: number
  person_name?: string
}

const props = withDefaults(
  defineProps<{
    data: MetricPoint[]
    metricName: string
    personName?: string
  }>(),
  {
    personName: undefined,
  },
)

const chartRef = ref<SVGSVGElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function drawChart() {
  if (!chartRef.value || !props.data.length) return

  const container = chartRef.value.parentElement
  if (!container) return

  const margin = { top: 20, right: 30, bottom: 40, left: 50 }
  const width = container.clientWidth - margin.left - margin.right
  const height = Math.max(200, (container.clientHeight || 250) - margin.top - margin.bottom)

  d3.select(chartRef.value).selectAll('*').remove()

  const svg = d3
    .select(chartRef.value)
    .attr('width', container.clientWidth)
    .attr('height', container.clientHeight || 250)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const parsedData = props.data
    .map((d) => ({
      ...d,
      date: new Date(d.date),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const xScale = d3.scaleTime().domain(d3.extent(parsedData, (d) => d.date) as [Date, Date]).range([0, width])

  const values = parsedData.map((d) => d.value)
  const minVal = Math.min(...values) - 0.1
  const maxVal = Math.max(...values) + 0.1

  const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0])

  // Grid
  svg.append('g').call(d3.axisLeft(yScale).ticks(5).tickSize(-width))
    .selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
  svg.selectAll('.tick line').attr('stroke', '#1f2937')

  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5))
    .selectAll('text').attr('fill', '#9ca3af').attr('font-size', '10px')
  svg.selectAll('.domain').attr('stroke', '#374151')

  // Area
  const area = d3
    .area<typeof parsedData[number]>()
    .x((d) => xScale(d.date))
    .y0(height)
    .y1((d) => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const gradient = svg
    .append('defs')
    .append('linearGradient')
    .attr('id', `metric-gradient-${props.metricName}`)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.2)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0)

  svg.append('path').datum(parsedData).attr('d', area).attr('fill', `url(#metric-gradient-${props.metricName})`)

  // Line
  const line = d3
    .line<typeof parsedData[number]>()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX)

  svg.append('path').datum(parsedData).attr('d', line).attr('fill', 'none').attr('stroke', '#8b5cf6').attr('stroke-width', 2)

  // Dots
  svg
    .selectAll('.dot')
    .data(parsedData)
    .join('circle')
    .attr('cx', (d) => xScale(d.date))
    .attr('cy', (d) => yScale(d.value))
    .attr('r', 3.5)
    .attr('fill', '#8b5cf6')
    .attr('stroke', '#111827')
    .attr('stroke-width', 1.5)

  // Legend
  if (props.personName) {
    svg
      .append('text')
      .attr('x', width - 8)
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .text(props.personName)
  }
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
  <div class="relative w-full h-full min-h-[250px]">
    <svg v-if="data.length" ref="chartRef" class="w-full h-full" />
    <div v-else class="w-full h-full flex items-center justify-center text-sm text-gray-600">
      No metric data
    </div>
  </div>
</template>
