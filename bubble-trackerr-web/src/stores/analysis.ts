import { defineStore } from 'pinia'
import { ref } from 'vue'
import { analysisService } from '@/services/analysis.service'
import type { AnalysisJob } from '@/types/domain'

export const useAnalysisStore = defineStore('analysis', () => {
  const jobs = ref<AnalysisJob[]>([])
  const currentText = ref('')
  const isSubmitting = ref(false)
  const sseConnected = ref(false)
  const error = ref<string | null>(null)

  async function submitAnalysis(text: string) {
    isSubmitting.value = true
    error.value = null
    currentText.value = text
    try {
      const result = await analysisService.submit(text)
      const job: AnalysisJob = {
        interaction_id: result.interaction_id,
        job_id: result.job_id,
        status: 'pending',
        text,
        created_at: new Date(),
      }
      jobs.value.unshift(job)
      return job
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit analysis'
      error.value = message
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  function updateJobStatus(
    interactionId: string,
    status: AnalysisJob['status'],
    result?: AnalysisJob['result'],
  ) {
    const job = jobs.value.find((j) => j.interaction_id === interactionId)
    if (job) {
      job.status = status
      if (result) {
        job.result = result
      }
    }
  }

  function setCurrentText(text: string) {
    currentText.value = text
  }

  function setSseConnected(connected: boolean) {
    sseConnected.value = connected
  }

  return {
    jobs,
    currentText,
    isSubmitting,
    sseConnected,
    error,
    submitAnalysis,
    updateJobStatus,
    setCurrentText,
    setSseConnected,
  }
})
