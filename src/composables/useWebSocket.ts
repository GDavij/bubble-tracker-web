import { ref, onUnmounted } from 'vue'
import { WS_URL } from '@/utils/constants'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

export function useWebSocket() {
  const status = ref<ConnectionStatus>('disconnected')
  const messageHandlers = new Set<(data: unknown) => void>()

  let ws: WebSocket | null = null
  let retryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalClose = false

  function getDelay(): number {
    const delay = BASE_DELAY_MS * Math.pow(2, retryCount)
    return Math.min(delay, MAX_DELAY_MS)
  }

  function scheduleReconnect() {
    if (retryCount >= MAX_RETRIES) {
      status.value = 'fallback'
      return
    }
    const delay = getDelay()
    retryTimer = setTimeout(() => {
      retryCount++
      connect()
    }, delay)
  }

  function handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data as string)
      messageHandlers.forEach((handler) => handler(data))
    } catch {
      messageHandlers.forEach((handler) => handler(event.data))
    }
  }

  function connect(url: string = WS_URL) {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    intentionalClose = false
    status.value = 'connecting'

    try {
      ws = new WebSocket(url)
    } catch {
      status.value = 'fallback'
      return
    }

    ws.onopen = () => {
      status.value = 'connected'
      retryCount = 0
    }

    ws.onmessage = handleMessage

    ws.onclose = () => {
      if (intentionalClose) {
        status.value = 'disconnected'
        return
      }
      scheduleReconnect()
    }

    ws.onerror = () => {
      if (!intentionalClose) {
        ws?.close()
      }
    }
  }

  function disconnect() {
    intentionalClose = true
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    status.value = 'disconnected'
    retryCount = 0
  }

  function send(data: unknown) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
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
    status,
    connect,
    disconnect,
    send,
    onMessage,
  }
}
