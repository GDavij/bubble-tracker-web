<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import { useSSE } from '@/composables/useSSE'
import apiClient, { handleApiError } from '@/services/api'
import AnalysisJobCard from '@/components/analysis/AnalysisJobCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import type { AnalysisJob } from '@/types/domain'

const router = useRouter()
const store = useAnalysisStore()

const text = ref('')
const MAX_CHARS = 10000
const charsLeft = computed(() => MAX_CHARS - text.value.length)
const canSubmit = computed(() => text.value.trim().length > 0 && !store.isSubmitting)

const loading = ref(true)
const error = ref<string | null>(null)

const sse = useSSE('/analysis/stream')

async function handleSubmit() {
  if (!canSubmit.value) return
  await store.submitAnalysis(text.value)
  text.value = ''
}

function handleClear() {
  text.value = ''
}

function handleViewJob(job: AnalysisJob) {
  // Navigate to the analysis detail or scroll to it
  router.push({ name: 'analysis', query: { job: job.job_id } })
}

function handleRetry(job: AnalysisJob) {
  store.submitAnalysis(job.text)
}

async function fetchJobs() {
  loading.value = true
  error.value = null
  try {
    const res = await apiClient.get<AnalysisJob[]>('/analysis/jobs')
    // Use splice to maintain reactivity on the store's ref array
    store.$patch({ jobs: res.data })
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  sse.onMessage((data: unknown) => {
    const msg = data as { interaction_id: string; status: string; [key: string]: unknown }
    store.updateJobStatus(
      msg.interaction_id,
      msg.status as AnalysisJob['status'],
      msg.result as AnalysisJob['result'] | undefined,
    )
  })
  sse.connect()
  fetchJobs()
})

onUnmounted(() => {
  sse.disconnect()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Input Section -->
    <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Describe a social interaction
      </label>
      <textarea
        v-model="text"
        :maxlength="MAX_CHARS"
        placeholder="Met PersonA for lunch today. PersonB joined us unexpectedly..."
        class="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
      <div class="flex items-center justify-between mt-3">
        <div class="flex gap-2">
          <BaseButton
            variant="primary"
            :disabled="!canSubmit"
            :loading="store.isSubmitting"
            @click="handleSubmit"
          >
            Analyze
          </BaseButton>
          <BaseButton variant="ghost" @click="handleClear">
            Clear
          </BaseButton>
        </div>
        <span
          :class="[
            'text-sm tabular-nums',
            charsLeft < 100 ? 'text-red-400' : 'text-gray-500',
          ]"
        >
          {{ charsLeft }}/{{ MAX_CHARS }}
        </span>
      </div>
    </div>

    <!-- Recent Analyses -->
    <div>
      <h2 class="text-lg font-semibold text-white mb-4">Recent Analyses</h2>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3"
        >
          <BaseSkeleton variant="text" width="70%" height="1rem" />
          <BaseSkeleton variant="text" width="40%" height="0.75rem" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error">
        <ErrorState :message="error" @retry="fetchJobs" />
      </div>

      <!-- Empty state -->
      <div v-else-if="store.jobs.length === 0" class="bg-gray-900 rounded-xl border border-gray-800">
        <EmptyState
          title="No analyses yet"
          description="Submit your first interaction to see results here."
        />
      </div>

      <!-- Job list -->
      <div v-else class="space-y-3">
        <AnalysisJobCard
          v-for="job in store.jobs"
          :key="job.job_id"
          :job="job"
          @view="handleViewJob"
          @retry="handleRetry"
        />
      </div>
    </div>
  </div>
</template>
