<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient, { handleApiError } from '@/services/api'
import type { Person } from '@/types/domain'
import type { SocialRole, Mood } from '@/types/domain'
import { ROLE_COLORS, MOOD_COLORS, MOOD_EMOJIS } from '@/utils/constants'
import { getRoleColor, getMoodEmoji, formatDate, truncate } from '@/utils/formatters'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const people = ref<Person[]>([])
const page = ref(1)
const pageSize = 20
const hasMore = ref(true)

const searchQuery = ref('')
const roleFilter = ref<SocialRole | ''>('')
const moodFilter = ref<Mood | ''>('')

const roles: SocialRole[] = ['bridge', 'mentor', 'anchor', 'catalyst', 'observer', 'drain', 'unknown']
const moods: Mood[] = ['happy', 'anxious', 'tired', 'energized', 'sad', 'neutral', 'angry', 'hopeful', 'lonely', 'grateful']

const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
    page.value = 1
    people.value = []
    fetchPeople()
  }, 300)
})

watch([roleFilter, moodFilter], () => {
  page.value = 1
  people.value = []
  fetchPeople()
})

const filteredPeople = computed(() => {
  let result = people.value
  if (roleFilter.value) {
    result = result.filter((p) => p.social_role === roleFilter.value)
  }
  if (moodFilter.value) {
    result = result.filter((p) => p.current_mood === moodFilter.value)
  }
  if (debouncedSearch.value) {
    const q = debouncedSearch.value.toLowerCase()
    result = result.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q)),
    )
  }
  return result
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getEnergyColor(energy: number): string {
  if (energy >= 7) return 'bg-green-500'
  if (energy >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getEnergyBg(energy: number): string {
  if (energy >= 7) return 'bg-green-100 dark:bg-green-900/30'
  if (energy >= 4) return 'bg-yellow-100 dark:bg-yellow-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

function goToPerson(id: string) {
  router.push(`/people/${id}`)
}

async function fetchPeople() {
  loading.value = true
  error.value = ''
  try {
    const res = await apiClient.get<Person[]>('/people', {
      params: {
        page: page.value,
        limit: pageSize,
        search: debouncedSearch.value || undefined,
        role: roleFilter.value || undefined,
        mood: moodFilter.value || undefined,
      },
    })
    if (res.data.length < pageSize) {
      hasMore.value = false
    }
    people.value = page.value === 1 ? res.data : [...people.value, ...res.data]
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!loading.value && hasMore.value) {
    page.value++
    fetchPeople()
  }
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
    loadMore()
  }
}

onMounted(() => {
  fetchPeople()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-4xl px-6 py-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">People</h1>

      <!-- Filters -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search people or aliases..."
            class="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
        <select
          v-model="roleFilter"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm capitalize dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All roles</option>
          <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
        </select>
        <select
          v-model="moodFilter"
          class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm capitalize dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All moods</option>
          <option v-for="mood in moods" :key="mood" :value="mood">{{ getMoodEmoji(mood) }} {{ mood }}</option>
        </select>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
        {{ error }}
        <button class="ml-2 font-medium text-red-600 underline hover:text-red-500" @click="fetchPeople">Retry</button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading && people.length === 0" class="space-y-3">
        <div v-for="i in 6" :key="i" class="flex animate-pulse items-center gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10">
          <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!loading && filteredPeople.length === 0"
        class="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800"
      >
        <svg class="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <h2 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">No people found</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ searchQuery || roleFilter || moodFilter ? 'Try adjusting your filters.' : 'Start by analyzing interactions to discover people.' }}
        </p>
      </div>

      <!-- People list -->
      <div v-else class="space-y-2 overflow-y-auto" style="max-height: calc(100vh - 240px)" @scroll="handleScroll">
        <div
          v-for="person in filteredPeople"
          :key="person.id"
          class="flex cursor-pointer items-center gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 transition-shadow hover:shadow-md dark:bg-gray-800 dark:ring-white/10"
          @click="goToPerson(person.id)"
        >
          <!-- PersonAvatar -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            :style="{ backgroundColor: getRoleColor(person.social_role) }"
          >
            {{ getInitials(person.display_name) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {{ person.display_name }}
              </h3>
              <!-- RoleBadge -->
              <span
                class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                :style="{
                  backgroundColor: getRoleColor(person.social_role) + '20',
                  color: getRoleColor(person.social_role),
                }"
              >
                {{ person.social_role }}
              </span>
            </div>
            <div class="mt-1 flex items-center gap-3">
              <!-- MoodIndicator -->
              <span class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {{ getMoodEmoji(person.current_mood) }}
                <span class="capitalize">{{ person.current_mood }}</span>
              </span>
              <!-- EnergyBar -->
              <div class="flex items-center gap-1.5">
                <div class="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-600">
                  <div
                    class="h-1.5 rounded-full transition-all"
                    :class="getEnergyColor(person.current_energy)"
                    :style="{ width: `${(person.current_energy / 10) * 100}%` }"
                  />
                </div>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ person.current_energy }}/10</span>
              </div>
            </div>
            <p v-if="person.aliases.length > 0" class="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
              aka {{ person.aliases.join(', ') }}
            </p>
          </div>

          <svg class="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <!-- Load more -->
        <div v-if="hasMore && !loading" class="py-4 text-center">
          <button
            class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            @click="loadMore"
          >
            Load more
          </button>
        </div>
        <div v-if="loading && people.length > 0" class="py-4 text-center">
          <svg class="mx-auto h-5 w-5 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
