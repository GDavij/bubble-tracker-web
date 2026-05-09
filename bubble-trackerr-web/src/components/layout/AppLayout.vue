<script setup lang="ts">
import { RouterView } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import TopBar from '@/components/layout/TopBar.vue'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-950">
    <Sidebar />

    <Transition name="fade">
      <div
        v-if="uiStore.sidebarOpen"
        class="fixed inset-0 bg-black/50 z-20 lg:hidden"
        @click="uiStore.setSidebarOpen(false)"
      />
    </Transition>

    <div class="flex-1 flex flex-col min-w-0">
      <TopBar />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
