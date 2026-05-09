<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useWebSocket } from '@/composables/useWebSocket'
import ChatBubble from '@/components/chat/ChatBubble.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { ChatMessage } from '@/types/domain'

const store = useChatStore()
const ws = useWebSocket()

const inputText = ref('')
const messageList = ref<HTMLElement | null>(null)

const canSend = computed(() => inputText.value.trim().length > 0 && !store.isSending)

const suggestedPrompts = [
  'What did I do yesterday?',
  'Summarize my week',
  'Who have I been connecting with lately?',
  'How is my relationship with PersonA?',
]

const connectionStatus = computed(() => {
  const s = store.wsStatus
  if (s === 'connected') return { dot: 'bg-green-500', label: 'Live', textClass: 'text-green-400' }
  if (s === 'connecting') return { dot: 'bg-yellow-500', label: 'Connecting', textClass: 'text-yellow-400' }
  if (s === 'disconnected') return { dot: 'bg-red-500', label: 'Disconnected', textClass: 'text-red-400' }
  return { dot: 'bg-gray-400', label: 'Polling', textClass: 'text-gray-400' }
})

async function sendMessage() {
  if (!canSend.value) return
  const content = inputText.value
  inputText.value = ''
  try {
    await store.sendMessage(content)
    await scrollToBottom()
  } catch {
    // Error already captured in store.error
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

function handleSuggestedPrompt(prompt: string) {
  inputText.value = prompt
  sendMessage()
}

function startNewChat() {
  store.clearMessages()
  store.setSession(null)
  inputText.value = ''
}

function handlePersonClick(name: string) {
  inputText.value = `Tell me about ${name}`
  sendMessage()
}

// Auto-scroll when messages change or typing state changes
watch(() => store.messages.length, async () => {
  await scrollToBottom()
})

watch(() => store.isTyping, async () => {
  await scrollToBottom()
})

onMounted(() => {
  // Sync WebSocket status to store
  const unwatch = watch(
      () => ws.status.value,
    (s) => {
      store.setWsStatus(s)
    },
    { immediate: true },
  )

  // Handle incoming WebSocket messages
  ws.onMessage((data: unknown) => {
    const msg = data as {
      type?: string
      content?: string
      sender?: string
      is_user?: boolean
      session_id?: string
      id?: string
      created_at?: string
    }

    if (msg.type === 'message' && msg.content) {
      const chatMsg: ChatMessage = {
        id: msg.id ?? crypto.randomUUID(),
        user_id: '',
        sender: (msg.sender as 'You' | 'BubbleTrack') ?? 'BubbleTrack',
        content: msg.content,
        is_user: msg.is_user === true,
        session_id: msg.session_id,
        created_at: msg.created_at ?? new Date().toISOString(),
      }
      store.addMessage(chatMsg)
    } else if (msg.type === 'typing') {
      store.isTyping = msg.content === 'start'
    } else if (msg.type === 'status') {
      if (msg.content === 'connected') {
        store.setWsStatus('connected')
      } else if (msg.content === 'disconnected') {
        store.setWsStatus('disconnected')
      }
    }
  })

  ws.connect()
  store.fetchMessages().catch(() => {})

  onUnmounted(() => {
    unwatch()
    ws.disconnect()
  })
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-8rem)]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-white">Chat</h2>
        <div class="flex items-center gap-1.5">
          <span
            :class="[
              'w-2 h-2 rounded-full',
              connectionStatus.dot,
            ]"
          />
          <span :class="['text-xs', connectionStatus.textClass]">
            {{ connectionStatus.label }}
          </span>
        </div>
      </div>
      <BaseButton variant="ghost" size="sm" @click="startNewChat">
        New Chat
      </BaseButton>
    </div>

    <!-- Messages Area -->
    <div
      ref="messageList"
      class="flex-1 overflow-y-auto space-y-1 px-1 scroll-smooth"
    >
      <!-- Empty state -->
      <div
        v-if="store.messages.length === 0 && !store.isTyping"
        class="flex items-center justify-center h-full"
      >
        <EmptyState
          icon="💬"
          title="Start a conversation"
          description="Ask about your social patterns, relationships, or recent interactions."
        >
          <template #action>
            <div class="flex flex-wrap justify-center gap-2 mt-2">
              <button
                v-for="prompt in suggestedPrompts"
                :key="prompt"
                class="px-3 py-1.5 text-sm rounded-full bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
                @click="handleSuggestedPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </template>
        </EmptyState>
      </div>

      <!-- Error banner -->
      <div
        v-if="store.error"
        class="bg-red-900/40 border border-red-800 rounded-lg px-4 py-2 mb-3"
      >
        <p class="text-sm text-red-300">{{ store.error }}</p>
      </div>

      <!-- Message list -->
      <template v-for="msg in store.messages" :key="msg.id">
        <ChatBubble :message="msg" @person-click="handlePersonClick" />
      </template>

      <!-- Typing indicator -->
      <ChatBubble
        v-if="store.isTyping"
        :message="{
          id: 'typing',
          user_id: '',
          sender: 'BubbleTrack',
          content: '',
          is_user: false,
          created_at: new Date().toISOString(),
        }"
        :typing="true"
      />
    </div>

    <!-- Input Bar -->
    <div class="mt-4 bg-gray-900 rounded-xl border border-gray-800 p-3 flex items-end gap-3">
      <textarea
        v-model="inputText"
        :disabled="store.isSending"
        rows="1"
        placeholder="Type a message..."
        class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[38px] max-h-[120px]"
        @keydown="handleKeydown"
      />
      <BaseButton
        variant="primary"
        size="sm"
        :disabled="!canSend"
        :loading="store.isSending"
        @click="sendMessage"
      >
        Send
      </BaseButton>
    </div>
  </div>
</template>
