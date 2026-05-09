<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
  }>(),
  {
    position: 'top',
    delay: 200,
  },
)

const visible = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

function show() {
  timeout = setTimeout(() => {
    visible.value = true
  }, props.delay)
}

function hide() {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  visible.value = false
}

const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClasses: Record<string, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-700 border-x-transparent border-b-transparent border-4',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-700 border-x-transparent border-t-transparent border-4',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-700 border-y-transparent border-r-transparent border-4',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-700 border-y-transparent border-l-transparent border-4',
}
</script>

<template>
  <div class="relative inline-flex" @mouseenter="show" @mouseleave="hide">
    <slot />
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        :class="[
          'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none',
          positionClasses[position],
        ]"
      >
        {{ text }}
        <span :class="['absolute', arrowClasses[position]]" />
      </div>
    </Transition>
  </div>
</template>
