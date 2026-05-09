import apiClient from '@/services/api'
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '@/types/auth'

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  async refresh(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const response = await apiClient.post<{
      access_token: string
      refresh_token: string
      expires_in: number
    }>('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  async me(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/auth/me')
    return response.data
  },
}
