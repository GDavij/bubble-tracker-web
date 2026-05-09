import apiClient from '@/services/api'
import type { Relationship } from '@/types/domain'

export const relationshipService = {
  async getAll(): Promise<Relationship[]> {
    const response = await apiClient.get<Relationship[]>('/relationships')
    return response.data
  },

  async getHealth(id: string): Promise<Record<string, number>> {
    const response = await apiClient.get<Record<string, number>>(`/relationships/${id}/health`)
    return response.data
  },
}
