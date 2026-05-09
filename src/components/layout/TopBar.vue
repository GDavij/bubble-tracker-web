<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const uiStore = useUiStore()
const authStore = useAuthStore()

const pageTitle = computed(() => (route.meta?.title as string) || 'Dashboard')
</script>

<template>
  <header
    class="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0"
  >
    <div class="flex items-center gap-3">
      <button class="lg:hidden p-2 hover:bg-gray-800 rounded-lg" @click="uiStore.toggleSidebar()">
        <span class="text-xl">☰</span>
      </button>
      <h1 class="text-lg font-semibold text-white">{{ pageTitle }}</h1>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <div
          class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium"
        >
          {{ authStore.user?.display_name?.charAt(0) || '?' }}
        </div>
        <span class="hidden sm:inline">{{ authStore.user?.display_name }}</span>
      </div>
    </div>
  </header>
</template>
