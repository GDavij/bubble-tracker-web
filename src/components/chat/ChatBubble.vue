<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '@/types/domain'

const props = defineProps<{
  message: ChatMessage
  typing?: boolean
}>()

const emit = defineEmits<{
  'person-click': [name: string]
}>()

const isUser = computed(() => props.message.is_user)

const formattedTime = computed(() => {
  const date = new Date(props.message.created_at)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
})

function handlePersonClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.classList.contains('person-link')) {
    emit('person-click', target.textContent ?? '')
  }
}
</script>

<template>
  <div
    :class="[
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start',
    ]"
  >
    <div
      v-if="typing"
      class="max-w-[75%] bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3"
    >
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0ms" />
        <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 150ms" />
        <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 300ms" />
      </div>
    </div>
    <div v-else :class="['flex flex-col max-w-[75%]', isUser ? 'items-end' : 'items-start']">
      <div
        :class="[
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-200 rounded-bl-sm',
        ]"
        v-html="message.content"
        @click="handlePersonClick"
      />
      <div class="flex items-center gap-2 mt-1 px-1">
        <span class="text-[10px] text-gray-500">{{ message.sender }}</span>
        <span class="text-[10px] text-gray-600">{{ formattedTime }}</span>
      </div>
    </div>
  </div>
</template>
