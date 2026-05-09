<script setup lang="ts">
defineProps<{
  tabs: Array<{ id: string; label: string; count?: number }>
  activeTab: string
}>()

const emit = defineEmits<{
  change: [tabId: string]
}>()
</script>

<template>
  <div class="flex items-center gap-1 border-b border-gray-800 overflow-x-auto">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="[
        'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
        activeTab === tab.id ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200',
      ]"
      @click="$emit('change', tab.id)"
    >
      <span class="flex items-center gap-2">
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300"
        >
          {{ tab.count }}
        </span>
      </span>
      <span
        v-if="activeTab === tab.id"
        class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full"
      />
    </button>
  </div>
</template>
