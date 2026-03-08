import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function urgencyColor(days: number, readiness: number): string {
  if (days <= 7 && readiness < 90) return 'red'
  if (days <= 14 && readiness < 75) return 'orange'
  if (days <= 21 && readiness < 85) return 'yellow'
  return 'green'
}

export function readinessBadgeClass(score: number): string {
  if (score >= 90) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (score >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  if (score >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 3) + '...'
}
