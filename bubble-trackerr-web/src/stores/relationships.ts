import { defineStore } from 'pinia'
import { ref } from 'vue'
import { relationshipService } from '@/services/relationships.service'
import type { Relationship } from '@/types/domain'

export const useRelationshipsStore = defineStore('relationships', () => {
  const list = ref<Relationship[]>([])
  const selectedRelationship = ref<Relationship | null>(null)
  const selectedHealth = ref<Record<string, number> | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      list.value = await relationshipService.getAll()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch relationships'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHealth(id: string) {
    error.value = null
    try {
      selectedHealth.value = await relationshipService.getHealth(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch health data'
      error.value = message
      throw err
    }
  }

  function selectRelationship(relationship: Relationship | null) {
    selectedRelationship.value = relationship
    if (relationship) {
      fetchHealth(relationship.id)
    } else {
      selectedHealth.value = null
    }
  }

  return {
    list,
    selectedRelationship,
    selectedHealth,
    isLoading,
    error,
    fetchAll,
    fetchHealth,
    selectRelationship,
  }
})
