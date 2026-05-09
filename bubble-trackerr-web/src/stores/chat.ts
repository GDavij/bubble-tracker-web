import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatService } from '@/services/chat.service'
import type { ChatMessage } from '@/types/domain'

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const currentSessionId = ref<string | null>(null)
  const isSending = ref(false)
  const isTyping = ref(false)
  const wsStatus = ref<WsStatus>('disconnected')
  const sessions = ref<string[]>([])
  const error = ref<string | null>(null)

  async function sendMessage(content: string, sessionId?: string) {
    isSending.value = true
    error.value = null
    try {
      const message = await chatService.sendMessage(content, sessionId ?? currentSessionId.value ?? undefined)
      messages.value.push(message)
      if (message.session_id && !sessions.value.includes(message.session_id)) {
        sessions.value.push(message.session_id)
      }
      if (message.session_id && !currentSessionId.value) {
        currentSessionId.value = message.session_id
      }
      return message
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message'
      error.value = message
      throw err
    } finally {
      isSending.value = false
    }
  }

  async function fetchMessages(sessionId?: string, limit: number = 50) {
    error.value = null
    try {
      messages.value = await chatService.getMessages(sessionId ?? currentSessionId.value ?? undefined, limit)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages'
      error.value = message
      throw err
    }
  }

  function setSession(sessionId: string | null) {
    currentSessionId.value = sessionId
    messages.value = []
  }

  function addMessage(message: ChatMessage) {
    messages.value.push(message)
    if (message.session_id && !sessions.value.includes(message.session_id)) {
      sessions.value.push(message.session_id)
    }
  }

  function setWsStatus(status: WsStatus) {
    wsStatus.value = status
  }

  function clearMessages() {
    messages.value = []
  }

  return {
    messages,
    currentSessionId,
    isSending,
    isTyping,
    wsStatus,
    sessions,
    error,
    sendMessage,
    fetchMessages,
    setSession,
    addMessage,
    setWsStatus,
    clearMessages,
  }
})
