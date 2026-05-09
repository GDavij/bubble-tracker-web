<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { SocialRole } from '@/types/domain'

const props = defineProps<{
  scores: Record<string, number>
}>()

const chartRef = ref<SVGSVGElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const roleColors: Record<string, string> = {
  bridge: '#f59e0b',
  mentor: '#3b82f6',
  anchor: '#10b981',
  catalyst: '#f97316',
  observer: '#94a3b8',
  drain: '#ef4444',
  unknown: '#6b7280',
}

const sortedEntries = computed(() => {
  return Object.entries(props.scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
})

function drawChart() {
  if (!chartRef.value || !sortedEntries.value.length) return

  const container = chartRef.value.parentElement
  if (!container) return

  const margin = { top: 10, right: 20, bottom: 10, left: 90 }
  const width = container.clientWidth - margin.left - margin.right
  const barHeight = 28
  const height = sortedEntries.value.length * (barHeight + 8) + margin.top + margin.bottom

  d3.select(chartRef.value).selectAll('*').remove()

  const svg = d3
    .select(chartRef.value)
    .attr('width', container.clientWidth)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const maxVal = d3.max(sortedEntries.value, ([, v]) => v) || 1
  const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, width])

  // Background bars
  svg
    .selectAll('.bg-bar')
    .data(sortedEntries.value)
    .join('rect')
    .attr('x', 0)
    .attr('y', (_, i) => i * (barHeight + 8))
    .attr('width', width)
    .attr('height', barHeight)
    .attr('rx', 4)
    .attr('fill', '#1f2937')

  // Value bars
  svg
    .selectAll('.value-bar')
    .data(sortedEntries.value)
    .join('rect')
    .attr('x', 0)
    .attr('y', (_, i) => i * (barHeight + 8))
    .attr('width', ([, v]) => xScale(v))
    .attr('height', barHeight)
    .attr('rx', 4)
    .attr('fill', ([k]) => roleColors[k] || '#6b7280')
    .attr('opacity', 0.8)

  // Labels
  svg
    .selectAll('.label')
    .data(sortedEntries.value)
    .join('text')
    .attr('x', -10)
    .attr('y', (_, i) => i * (barHeight + 8) + barHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#d1d5db')
    .attr('font-size', '12px')
    .text(([k]) => k.charAt(0).toUpperCase() + k.slice(1))

  // Values
  svg
    .selectAll('.value-text')
    .data(sortedEntries.value)
    .join('text')
    .attr('x', ([, v]) => xScale(v) + 8)
    .attr('y', (_, i) => i * (barHeight + 8) + barHeight / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text(([, v]) => v.toFixed(2))
}

onMounted(() => {
  drawChart()
  if (chartRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => drawChart())
    resizeObserver.observe(chartRef.value.parentElement)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="w-full">
    <svg v-if="sortedEntries.length" ref="chartRef" class="w-full" />
    <div v-else class="py-8 text-center text-sm text-gray-600">No role scores</div>
  </div>
</template>
