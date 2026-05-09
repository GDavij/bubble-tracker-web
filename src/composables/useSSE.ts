import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/utils/constants'

export function useSSE(url: string) {
  const connected = ref(false)
  const messageHandlers = new Set<(data: unknown) => void>()

  let eventSource: EventSource | null = null

  function getAuthenticatedUrl(): string {
    const authStore = useAuthStore()
    const separator = url.includes('?') ? '&' : '?'
    return `${API_BASE_URL}${url}${separator}token=${authStore.accessToken}`
  }

  function connect() {
    if (eventSource) {
      return
    }

    const targetUrl = getAuthenticatedUrl()

    eventSource = new EventSource(targetUrl)

    eventSource.onopen = () => {
      connected.value = true
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        messageHandlers.forEach((handler) => handler(data))
      } catch {
        messageHandlers.forEach((handler) => handler(event.data))
      }
    }

    eventSource.onerror = () => {
      connected.value = false
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    connected.value = false
  }

  function onMessage(handler: (data: unknown) => void) {
    messageHandlers.add(handler)
    return () => {
      messageHandlers.delete(handler)
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    disconnect,
    onMessage,
  }
}
