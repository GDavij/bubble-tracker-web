import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import type { LoginRequest, RegisterRequest, UserProfile } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const userProfile = computed(() => user.value)

  function setAccessToken(token: string) {
    accessToken.value = token
    localStorage.setItem('access_token', token)
  }

  async function login(data: LoginRequest) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.login(data)
      accessToken.value = response.access_token
      localStorage.setItem('refresh_token', response.refresh_token)
      user.value = response.user
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.register(data)
      accessToken.value = response.access_token
      localStorage.setItem('refresh_token', response.refresh_token)
      user.value = response.user
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // Ignore logout API errors — clear local state regardless
    } finally {
      user.value = null
      accessToken.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  async function refreshTokens() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      await logout()
      return false
    }
    try {
      const tokens = await authService.refresh(refreshToken)
      accessToken.value = tokens.access_token
      if (tokens.refresh_token) {
        localStorage.setItem('refresh_token', tokens.refresh_token)
      }
      return true
    } catch {
      await logout()
      return false
    }
  }

  async function fetchUser() {
    isLoading.value = true
    error.value = null
    try {
      user.value = await authService.me()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user'
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /** Try to restore session on page load. Returns true if auth is valid. */
  async function initializeAuth(): Promise<boolean> {
    if (!accessToken.value) {
      initialized.value = true
      return false
    }
    try {
      await fetchUser()
      initialized.value = true
      return true
    } catch {
      logout()
      initialized.value = true
      return false
    }
  }

  return {
    user,
    accessToken,
    isLoading,
    error,
    initialized,
    isAuthenticated,
    userProfile,
    setAccessToken,
    login,
    register,
    logout,
    refreshTokens,
    fetchUser,
    initializeAuth,
  }
})
