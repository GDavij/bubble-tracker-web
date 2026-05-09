<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graph'
import { analysisService } from '@/services/analysis.service'
import type { RoleClassification } from '@/types/graph'
import type { SocialRole } from '@/types/domain'
import { usePeopleStore } from '@/stores/people'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import RoleBadge from '@/components/people/RoleBadge.vue'
import PersonAvatar from '@/components/people/PersonAvatar.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import * as d3 from 'd3'

type ViewMode = 'grid' | 'list' | 'chart'

const router = useRouter()
const graphStore = useGraphStore()
const peopleStore = usePeopleStore()

const viewMode = ref<ViewMode>('grid')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const roles = ref<Record<string, RoleClassification>>({})
const sortColumn = ref<'person' | 'role' | 'confidence'>('role')
const sortDirection = ref<'asc' | 'desc'>('desc')
const chartSvgRef = ref<SVGSVGElement | null>(null)

const roleOrder: SocialRole[] = ['bridge', 'mentor', 'anchor', 'catalyst', 'observer', 'drain', 'unknown']

const roleLabels: Record<SocialRole, string> = {
  bridge: 'Bridge',
  mentor: 'Mentor',
  anchor: 'Anchor',
  catalyst: 'Catalyst',
  observer: 'Observer',
  drain: 'Drain',
  unknown: 'Unknown',
}

const roleColorsMap: Record<SocialRole, string> = {
  bridge: '#f59e0b',
  mentor: '#3b82f6',
  anchor: '#10b981',
  catalyst: '#f97316',
  observer: '#94a3b8',
  drain: '#ef4444',
  unknown: '#6b7280',
}

// Build person list with role data
const peopleWithRoles = computed(() => {
  return graphStore.nodes
    .filter((node) => roles.value[node.id] !== undefined)
    .map((node) => {
      const roleClass = roles.value[node.id]!
      return {
        id: node.id,
        name: node.display_name,
        role: roleClass.primary_role,
        confidence: roleClass.confidence,
        scores: roleClass.scores,
      }
    })
})

// Grouped by role for grid view
const groupedByRole = computed(() => {
  const groups: Record<string, typeof peopleWithRoles.value> = {}
  for (const person of peopleWithRoles.value) {
    const role = person.role
    if (!groups[role]) groups[role] = []
    groups[role].push(person)
  }
  return groups
})

// Sorted list for table view
const sortedPeople = computed(() => {
  const sorted = [...peopleWithRoles.value]
  sorted.sort((a, b) => {
    let cmp = 0
    if (sortColumn.value === 'person') {
      cmp = a.name.localeCompare(b.name)
    } else if (sortColumn.value === 'role') {
      cmp = a.role.localeCompare(b.role)
    } else if (sortColumn.value === 'confidence') {
      cmp = a.confidence - b.confidence
    }
    return sortDirection.value === 'desc' ? -cmp : cmp
  })
  return sorted
})

// Role distribution counts
const distribution = computed(() => {
  const dist: Record<string, number> = {}
  for (const p of peopleWithRoles.value) {
    dist[p.role] = (dist[p.role] ?? 0) + 1
  }
  return dist
})

function toggleSort(column: 'person' | 'role' | 'confidence') {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
}

function sortIcon(column: string) {
  if (sortColumn.value !== column) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function navigateToPerson(personId: string) {
  router.push(`/people/${personId}`)
}

// D3 donut chart
function drawDonutChart() {
  if (!chartSvgRef.value) return
  const svg = d3.select(chartSvgRef.value)
  svg.selectAll('*').remove()

  const data = roleOrder
    .map((role) => ({ role, count: distribution.value[role] || 0 }))
    .filter((d) => d.count > 0)

  if (data.length === 0) return

  const width = 400
  const height = 400
  const radius = Math.min(width, height) / 2 - 40

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`)

  const pie = d3.pie<{ role: string; count: number }>().value((d) => d.count)
  const arc = d3
    .arc<d3.PieArcDatum<{ role: string; count: number }>>()
    .innerRadius(radius * 0.5)
    .outerRadius(radius)

  const path = g
    .selectAll('path')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d) => roleColorsMap[d.data.role as SocialRole] || '#6b7280')
    .attr('stroke', '#111827')
    .attr('stroke-width', 2)

  // Animate
  path
    .transition()
    .duration(600)
    .attrTween('d', function (d) {
      const interpolate = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d)
      return (t: number) => arc(interpolate(t))!
    })

  // Center text
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .attr('fill', '#f9fafb')
    .attr('font-size', '28px')
    .attr('font-weight', 'bold')
    .text(data.reduce((sum, d) => sum + d.count, 0))

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.2em')
    .attr('fill', '#9ca3af')
    .attr('font-size', '13px')
    .text('total people')

  // Legend
  const legend = svg
    .append('g')
    .attr('transform', `translate(${width - 140}, ${height / 2 - data.length * 14})`)

  legend
    .selectAll('g')
    .data(data)
    .enter()
    .append('g')
    .attr('transform', (_, i) => `translate(0, ${i * 28})`)
    .each(function (d) {
      const lg = d3.select(this)
      lg.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('fill', roleColorsMap[d.role as SocialRole] || '#6b7280')

      lg.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('fill', '#d1d5db')
        .attr('font-size', '12px')
        .text(`${roleLabels[d.role as SocialRole] || d.role} (${d.count})`)
    })
}

watch(distribution, () => {
  if (viewMode.value === 'chart') drawDonutChart()
})

watch(viewMode, (mode) => {
  if (mode === 'chart') {
    requestAnimationFrame(drawDonutChart)
  }
})

async function loadData() {
  isLoading.value = true
  loadError.value = null
  try {
    await Promise.all([
      peopleStore.fetchList(),
      graphStore.fetchGraph(),
    ])
    roles.value = await analysisService.getRoles()
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load role classifications'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <h1 class="text-2xl font-bold text-white">Role Classifications</h1>

      <!-- View mode toggle -->
      <div class="inline-flex rounded-lg border border-gray-700 overflow-hidden">
        <button
          v-for="mode in (['grid', 'list', 'chart'] as ViewMode[])"
          :key="mode"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors',
            viewMode === mode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200',
          ]"
          @click="viewMode = mode"
        >
          <span v-if="mode === 'grid'">📐 Grid</span>
          <span v-else-if="mode === 'list'">📋 List</span>
          <span v-else>📊 Chart</span>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <template v-if="isLoading">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <BaseSkeleton variant="rectangular" height="6rem" />
        </div>
      </div>
    </template>

    <!-- Error state -->
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadData" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="peopleWithRoles.length === 0"
      icon="🎭"
      title="No role classifications"
      description="Role data will appear once people have been analyzed."
    />

    <!-- Grid View -->
    <template v-else-if="viewMode === 'grid'">
      <div
        v-for="role in roleOrder"
        :key="role"
        class="space-y-3"
      >
        <div
          v-if="groupedByRole[role]?.length"
          class="flex items-center gap-2"
        >
          <span
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: roleColorsMap[role] }"
          />
          <h2 class="text-lg font-semibold text-white">{{ roleLabels[role] }}</h2>
          <span class="text-sm text-gray-500">({{ groupedByRole[role].length }})</span>
        </div>

        <div
          v-if="groupedByRole[role]?.length"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          <BaseCard
            v-for="person in groupedByRole[role]"
            :key="person.id"
            padding="md"
            hoverable
            clickable
            @click="navigateToPerson(person.id)"
          >
            <div class="flex items-center gap-3">
              <PersonAvatar
                :name="person.name"
                :role="person.role"
                size="md"
              />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-white truncate">{{ person.name }}</div>
                <div class="text-xs text-gray-400">
                  {{ Math.round(person.confidence * 100) }}% confidence
                </div>
              </div>
              <RoleBadge :role="person.role" />
            </div>
          </BaseCard>
        </div>
      </div>
    </template>

    <!-- List View -->
    <template v-else-if="viewMode === 'list'">
      <BaseCard padding="none">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-800">
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200"
                @click="toggleSort('person')"
              >
                Person {{ sortIcon('person') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200"
                @click="toggleSort('role')"
              >
                Role {{ sortIcon('role') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200"
                @click="toggleSort('confidence')"
              >
                Confidence {{ sortIcon('confidence') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/50">
            <tr
              v-for="person in sortedPeople"
              :key="person.id"
              class="hover:bg-gray-800/40 cursor-pointer transition-colors"
              @click="navigateToPerson(person.id)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <PersonAvatar
                    :name="person.name"
                    :role="person.role"
                    size="sm"
                  />
                  <span class="text-sm text-white">{{ person.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <RoleBadge :role="person.role" />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-24 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-blue-500 transition-all"
                      :style="{ width: `${Math.round(person.confidence * 100)}%` }"
                    />
                  </div>
                  <span class="text-sm text-gray-400">{{ Math.round(person.confidence * 100) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </template>

    <!-- Chart View -->
    <template v-else-if="viewMode === 'chart'">
      <BaseCard padding="lg">
        <div class="flex justify-center">
          <svg ref="chartSvgRef" class="w-full max-w-[500px]" />
        </div>
      </BaseCard>
    </template>
  </div>
</template>
