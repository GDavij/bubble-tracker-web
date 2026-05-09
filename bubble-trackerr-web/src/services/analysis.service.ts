import apiClient from '@/services/api'

import type { RoleClassification, GraphNode } from '@/types/graph'
import type { AggregatedProfile } from '@/types/graph'

export const analysisService = {
  async submit(text: string): Promise<{ interaction_id: string; job_id: string; status: string }> {
    const response = await apiClient.post<{ interaction_id: string; job_id: string; status: string }>(
      '/analysis/submit',
      { text },
    )
    return response.data
  },

  async getRoles(): Promise<Record<string, RoleClassification>> {
    const response = await apiClient.get<Record<string, RoleClassification>>('/analysis/roles')
    return response.data
  },

  async getProfiles(): Promise<Record<string, AggregatedProfile>> {
    const response = await apiClient.get<Record<string, AggregatedProfile>>('/analysis/profiles')
    return response.data
  },
}
