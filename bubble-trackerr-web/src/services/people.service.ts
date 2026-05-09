import apiClient from '@/services/api'
import type { GraphNode, NodeMetrics, RoleClassification } from '@/types/graph'

export const peopleService = {
  async list(): Promise<GraphNode[]> {
    const response = await apiClient.get<GraphNode[]>('/people')
    return response.data
  },

  async getById(id: string): Promise<GraphNode> {
    const response = await apiClient.get<GraphNode>(`/people/${id}`)
    return response.data
  },

  async getMetrics(id: string): Promise<NodeMetrics> {
    const response = await apiClient.get<NodeMetrics>(`/people/${id}/metrics`)
    return response.data
  },

  async classify(id: string): Promise<RoleClassification> {
    const response = await apiClient.get<RoleClassification>(`/people/${id}/classify`)
    return response.data
  },

  async getMetricHistory(id: string, metric: string, limit: number = 30): Promise<Record<string, unknown>[]> {
    const response = await apiClient.get<Record<string, unknown>[]>(`/people/${id}/metrics/${metric}/history`, {
      params: { limit },
    })
    return response.data
  },
}
