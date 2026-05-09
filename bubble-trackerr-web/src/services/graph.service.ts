import apiClient from '@/services/api'
import type { GraphData, FullGraphData, GraphSnapshot } from '@/types/graph'

export const graphService = {
  async getGraph(): Promise<GraphData> {
    const response = await apiClient.get<GraphData>('/graph')
    return response.data
  },

  async getFullGraph(): Promise<FullGraphData> {
    const response = await apiClient.get<FullGraphData>('/graph/full')
    return response.data
  },

  async getSnapshot(): Promise<GraphSnapshot> {
    const response = await apiClient.get<GraphSnapshot>('/graph/snapshot')
    return response.data
  },
}
