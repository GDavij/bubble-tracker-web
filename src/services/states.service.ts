import apiClient from '@/services/api'
import type { PersonState } from '@/types/domain'

export const statesService = {
  async getTimeline(
    limit: number = 50,
  ): Promise<{ states: PersonState[]; count: number }> {
    const response = await apiClient.get<{ states: PersonState[]; count: number }>('/states/timeline', {
      params: { limit },
    })
    return response.data
  },

  async getSelfStates(
    limit: number = 30,
  ): Promise<{ states: PersonState[]; count: number }> {
    const response = await apiClient.get<{ states: PersonState[]; count: number }>('/states/self', {
      params: { limit },
    })
    return response.data
  },
}
