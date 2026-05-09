<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient, { handleApiError } from '@/services/api'
import type { AuthResponse } from '@/types/auth'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const formValid = computed(() => {
  return email.value.trim().length > 0 && password.value.length >= 6
})

const emailError = computed(() => {
  if (!email.value.trim()) return ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) return 'Please enter a valid email address'
  return ''
})

const passwordError = computed(() => {
  if (!password.value) return ''
  if (password.value.length < 6) return 'Password must be at least 6 characters'
  return ''
})

async function handleLogin() {
  if (!formValid.value || emailError.value || passwordError.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: email.value.trim(),
      password: password.value,
    })

    const { access_token, refresh_token } = response.data
    localStorage.setItem('access_token', access_token)
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token)
    }

    router.push('/dashboard')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const status = axiosErr.response?.status
      if (status === 401) {
        error.value = 'Invalid email or password'
      } else if (status === 400) {
        error.value = axiosErr.response?.data?.detail ?? 'Invalid request'
      } else {
        error.value = handleApiError(err)
      }
    } else if (err instanceof Error) {
      error.value = 'No response from server. Please check your connection.'
    } else {
      error.value = 'An unexpected error occurred'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          BubbleTracker
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in to your account
        </p>
      </div>

      <form
        class="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-white/10"
        @submit.prevent="handleLogin"
      >
        <div v-if="error" class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {{ error }}
        </div>

        <div class="mb-5">
          <label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
            class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500': emailError }"
          />
          <p v-if="emailError" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ emailError }}
          </p>
        </div>

        <div class="mb-6">
          <label for="password" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder="Enter your password"
              class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500': passwordError }"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="showPassword = !showPassword"
            >
              <span v-if="showPassword" class="text-xs">Hide</span>
              <span v-else class="text-xs">Show</span>
            </button>
          </div>
          <p v-if="passwordError" class="mt-1 text-xs text-red-600 dark:text-red-400">
            {{ passwordError }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="loading || !formValid"
          class="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-gray-800"
        >
          <svg
            v-if="loading"
            class="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?
        <router-link
          to="/auth/register"
          class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Create one
        </router-link>
      </p>
    </div>
  </div>
</template>
