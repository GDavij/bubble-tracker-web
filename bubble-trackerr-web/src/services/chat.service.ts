import apiClient from '@/services/api'
import type { ChatMessage } from '@/types/domain'

export const chatService = {
  async sendMessage(content: string, sessionId?: string): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>('/chat', {
      content,
      session_id: sessionId,
    })
    return response.data
  },

  async getMessages(sessionId?: string, limit: number = 50): Promise<ChatMessage[]> {
    const params: Record<string, string | number> = {}
    if (sessionId) params.session_id = sessionId
    params.limit = limit

    const response = await apiClient.get<ChatMessage[]>('/chat/messages', { params })
    return response.data
  },
}
