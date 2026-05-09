import type { SocialRole, Mood, Quality } from '@/types/domain'
import { ROLE_COLORS, QUALITY_COLORS, MOOD_EMOJIS } from '@/utils/constants'

function relativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWeek < 5) return `${diffWeek}w ago`
  if (diffMonth < 12) return `${diffMonth}mo ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function formatDate(date: string): string {
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return date
  return relativeTime(parsed)
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatScore(value: number): string {
  return value.toFixed(2)
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '…'
}

export function getRoleColor(role: SocialRole): string {
  return ROLE_COLORS[role] ?? ROLE_COLORS['unknown'] ?? '#6b7280'
}

export function getQualityColor(quality: Quality): string {
  return QUALITY_COLORS[quality] ?? QUALITY_COLORS['unknown'] ?? '#6b7280'
}

export function getMoodEmoji(mood: Mood): string {
  return MOOD_EMOJIS[mood] ?? '😐'
}
