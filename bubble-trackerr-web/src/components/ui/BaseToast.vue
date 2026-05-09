<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>(),
  {
    type: 'info',
    duration: 4000,
  },
)

const emit = defineEmits<{
  dismiss: []
}>()

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const typeConfig: Record<string, { border: string; icon: string; bg: string }> = {
  success: {
    border: 'border-l-green-500',
    icon: '✓',
    bg: 'bg-green-500/10',
  },
  error: {
    border: 'border-l-red-500',
    icon: '✕',
    bg: 'bg-red-500/10',
  },
  warning: {
    border: 'border-l-yellow-500',
    icon: '⚠',
    bg: 'bg-yellow-500/10',
  },
  info: {
    border: 'border-l-blue-500',
    icon: 'ℹ',
    bg: 'bg-blue-500/10',
  },
}

function dismiss() {
  visible.value = false
  emit('dismiss')
}

onMounted(() => {
  visible.value = true
  if (props.duration > 0) {
    timer = setTimeout(dismiss, props.duration)
  }
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div
      v-if="visible"
      :class="[
        'fixed bottom-4 right-4 z-[60] flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-xl max-w-sm',
        typeConfig[type]!.border,
        typeConfig[type]!.bg,
      ]"
    >
      <span class="text-lg flex-shrink-0 mt-0.5">{{ typeConfig[type]!.icon }}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-200">{{ message }}</p>
        <div v-if="$slots.action" class="mt-2">
          <slot name="action" />
        </div>
      </div>
      <button
        class="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-white transition-colors"
        @click="dismiss"
        aria-label="Dismiss"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
