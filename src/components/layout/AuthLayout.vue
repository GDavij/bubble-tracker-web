<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-4xl mb-2">◉</div>
        <h1 class="text-2xl font-bold text-white">BubbleTracker</h1>
        <p class="text-gray-400 text-sm mt-1">Social Dynamics Analyzer</p>
      </div>
      <div class="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
        <RouterView />
      </div>
    </div>
  </div>
</template>
