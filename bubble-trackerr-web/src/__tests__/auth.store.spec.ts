import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import type { AuthResponse } from '@/types/auth'

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  }
}))

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('initializes with no user', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('login sets user and tokens', async () => {
    const { authService } = await import('@/services/auth.service')
    const mockResponse = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      token_type: 'Bearer',
      expires_in: 900,
      user: { id: '1', email: 'test@test.com', display_name: 'Test' }
    }
    vi.mocked(authService.login).mockResolvedValue(mockResponse)
    
    const store = useAuthStore()
    await store.login({ email: 'test@test.com', password: 'password' })
    
    expect(store.user?.email).toBe('test@test.com')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('refresh_token')).toBe('test-refresh')
  })

  it('logout clears all auth state', async () => {
    const store = useAuthStore()
    // First login
    const { authService } = await import('@/services/auth.service')
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 't', refresh_token: 'r', token_type: 'Bearer',
      expires_in: 900, user: { id: '1', email: 'e@e.com', display_name: 'T' }
    })
    await store.login({ email: 'e@e.com', password: 'p' })
    expect(store.isAuthenticated).toBe(true)
    
    // Then logout
    await store.logout()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('handles login failure gracefully', async () => {
    const { authService } = await import('@/services/auth.service')
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))
    
    const store = useAuthStore()
    await expect(store.login({ email: 'bad@email.com', password: 'wrong' })).rejects.toThrow('Invalid credentials')
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('register creates account and sets user', async () => {
    const { authService } = await import('@/services/auth.service')
    const mockResponse = {
      access_token: 'reg-token',
      refresh_token: 'reg-refresh',
      token_type: 'Bearer',
      expires_in: 900,
      user: { id: '2', email: 'new@test.com', display_name: 'NewUser' }
    }
    vi.mocked(authService.register).mockResolvedValue(mockResponse)
    
    const store = useAuthStore()
    await store.register({ email: 'new@test.com', password: 'password', display_name: 'NewUser' })
    
    expect(store.user?.email).toBe('new@test.com')
    expect(store.isAuthenticated).toBe(true)
  })

  it('isAuthenticated is false when no token', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('tracks loading state during login', async () => {
    const { authService } = await import('@/services/auth.service')
    let resolvePromise!: (value: AuthResponse) => void
    vi.mocked(authService.login).mockReturnValue(new Promise<AuthResponse>((resolve) => { resolvePromise = resolve }))
    
    const store = useAuthStore()
    const loginPromise = store.login({ email: 'test@test.com', password: 'password' })
    
    expect(store.isLoading).toBe(true)
    
    resolvePromise({
      access_token: 't', refresh_token: 'r', token_type: 'Bearer',
      expires_in: 900, user: { id: '1', email: 'test@test.com', display_name: 'Test' }
    })
    
    await loginPromise
    expect(store.isLoading).toBe(false)
  })

  it('logout clears tokens from localStorage', async () => {
    localStorage.setItem('access_token', 'some-token')
    localStorage.setItem('refresh_token', 'some-refresh')
    
    const store = useAuthStore()
    await store.logout()
    
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})
