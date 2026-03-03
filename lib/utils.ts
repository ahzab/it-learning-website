// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ar-MA', {
    year: 'numeric',
    month: 'long',
  })
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// ── Re-export utils submodules so routes can import from '@/lib/utils' ────────
export * from './utils/httpResponse'
export * from './utils/logger'
export * from './utils/idGuard'
export * from './utils/mobileValidate'
