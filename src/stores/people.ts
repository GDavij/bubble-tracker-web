import { defineStore } from 'pinia'
import { ref } from 'vue'
import { peopleService } from '@/services/people.service'
import type { GraphNode, NodeMetrics, RoleClassification } from '@/types/graph'

interface PeopleFilters {
  roles: string[]
  search: string
}

export const usePeopleStore = defineStore('people', () => {
  const list = ref<GraphNode[]>([])
  const selectedPerson = ref<GraphNode | null>(null)
  const selectedPersonMetrics = ref<NodeMetrics | null>(null)
  const selectedPersonRole = ref<RoleClassification | null>(null)
  const isLoading = ref(false)
  const isLoadingDetail = ref(false)
  const filters = ref<PeopleFilters>({
    roles: [],
    search: '',
  })
  const error = ref<string | null>(null)

  async function fetchList() {
    isLoading.value = true
    error.value = null
    try {
      list.value = await peopleService.list()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch people'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPerson(id: string) {
    isLoadingDetail.value = true
    error.value = null
    try {
      selectedPerson.value = await peopleService.getById(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch person'
      error.value = message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }

  async function fetchMetrics(id: string) {
    isLoadingDetail.value = true
    error.value = null
    try {
      selectedPersonMetrics.value = await peopleService.getMetrics(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metrics'
      error.value = message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }

  async function classifyRole(id: string) {
    isLoadingDetail.value = true
    error.value = null
    try {
      selectedPersonRole.value = await peopleService.classify(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to classify role'
      error.value = message
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }

  function setFilters(newFilters: Partial<PeopleFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    list,
    selectedPerson,
    selectedPersonMetrics,
    selectedPersonRole,
    isLoading,
    isLoadingDetail,
    filters,
    error,
    fetchList,
    fetchPerson,
    fetchMetrics,
    classifyRole,
    setFilters,
  }
})
