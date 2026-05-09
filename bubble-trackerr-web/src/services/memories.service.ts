import apiClient from '@/services/api'
import type { MemoryResult } from '@/types/domain'

export const memoriesService = {
  async search(
    query: string,
    params?: { limit?: number; person?: string; session?: string; segment?: string },
  ): Promise<{ memories: MemoryResult[] }> {
    const response = await apiClient.get<{ memories: MemoryResult[] }>('/memories/search', {
      params: {
        q: query,
        limit: params?.limit,
        person: params?.person,
        session: params?.session,
        segment: params?.segment,
      },
    })
    return response.data
  },
}
