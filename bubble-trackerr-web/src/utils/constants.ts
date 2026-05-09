export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

export const ROLE_COLORS: Record<string, string> = {
  bridge: '#f59e0b',
  mentor: '#3b82f6',
  anchor: '#10b981',
  catalyst: '#f97316',
  observer: '#94a3b8',
  drain: '#ef4444',
  unknown: '#6b7280',
}

export const QUALITY_COLORS: Record<string, string> = {
  nourishing: '#22c55e',
  neutral: '#9ca3af',
  draining: '#ef4444',
  conflicted: '#eab308',
  unknown: '#6b7280',
}

export const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  anxious: '😰',
  tired: '😴',
  energized: '⚡',
  sad: '😢',
  neutral: '😐',
  angry: '😠',
  hopeful: '🙏',
  lonely: '😔',
  grateful: '🥰',
}

export const MOOD_COLORS: Record<string, string> = {
  happy: '#facc15',
  anxious: '#a78bfa',
  tired: '#9ca3af',
  energized: '#fb923c',
  sad: '#60a5fa',
  neutral: '#d1d5db',
  angry: '#f87171',
  hopeful: '#34d399',
  lonely: '#818cf8',
  grateful: '#f472b6',
}
