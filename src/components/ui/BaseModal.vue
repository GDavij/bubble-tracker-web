<script setup lang="ts">
import { watch, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    title: '',
    size: 'md',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const isVisible = ref(props.open)

watch(
  () => props.open,
  (val) => {
    isVisible.value = val
  },
)

function close() {
  isVisible.value = false
  emit('update:open', false)
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown="onKeydown"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" @click="onBackdropClick" />
        <div
          :class="[
            'relative w-full bg-gray-900 rounded-xl border border-gray-800 shadow-2xl flex flex-col max-h-[85vh]',
            sizeClasses[size],
          ]"
          role="dialog"
          aria-modal="true"
        >
          <div
            v-if="title"
            class="flex items-center justify-between px-6 py-4 border-b border-gray-800"
          >
            <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              @click="close"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div v-else class="absolute top-4 right-4">
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              @click="close"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-800">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
