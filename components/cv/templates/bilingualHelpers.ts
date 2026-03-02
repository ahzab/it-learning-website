// components/cv/templates/bilingualHelpers.ts
import { CVMode } from '@/types/cv'

/**
 * Returns the correct text to display based on CVMode.
 * - 'ar'  → Arabic only
 * - 'en'  → English only (falls back to Arabic if no EN)
 * - 'bilingual' → renders both (caller must handle dual rendering)
 */
export function t(ar: string, en: string | undefined, mode: CVMode): string {
  if (mode === 'en') return en?.trim() || ar
  return ar
}

/**
 * For bilingual mode: returns ar / en as a combined display node spec.
 * Templates use this to decide whether to show one line or two.
 */
export function biName(ar: string, en: string | undefined, mode: CVMode) {
  if (mode === 'bilingual' && en?.trim()) {
    return { ar, en: en.trim(), bilingual: true }
  }
  return { ar: mode === 'en' ? (en?.trim() || ar) : ar, en: '', bilingual: false }
}

/** Whether to use LTR layout (English-only mode) */
export function isLTR(mode: CVMode) {
  return mode === 'en'
}

/** Section title label */
export function sectionLabel(arLabel: string, enLabel: string, mode: CVMode): string {
  if (mode === 'en') return enLabel
  if (mode === 'bilingual') return `${arLabel} / ${enLabel}`
  return arLabel
}

/** Date range display */
export function dateRange(start: string, end: string, isCurrent: boolean, mode: CVMode): string {
  const now = mode === 'en' ? 'Present' : 'حتى الآن'
  return `${start}${(start && (end || isCurrent)) ? ' — ' : ''}${isCurrent ? now : end}`
}
