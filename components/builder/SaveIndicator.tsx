'use client'
// components/builder/SaveIndicator.tsx
// Self-contained — reads translations via useT() internally.
// Guards against t.builder being undefined during SSR/hydration.

import { useT } from '@/lib/i18n/context'

type Status = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  status:      Status
  lastSaved:   Date | null
  onSave:      () => void
  // legacy / ignored props kept for call-site compatibility
  b?:          unknown
  isEn?:       boolean
  timeLocale?: string
}

export function SaveIndicator({ status, lastSaved, onSave }: Props) {
  const { t, locale } = useT()
  // Guard: t.builder can be undefined during SSR or if locale is misconfigured
  const b = t?.builder
  const fmt = (d: Date) =>
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  // Fallback strings if translation object not yet loaded
  const saveLabel    = b?.save        ?? 'Save'
  const savingLabel  = b?.saving      ?? 'Saving…'
  const savedLabel   = b?.saved       ?? 'Saved'
  const retryLabel   = b?.saveRetry   ?? 'Retry'

  if (status === 'saving') return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 px-3 py-2 rounded-lg border border-white/8">
      <span className="animate-spin">⟳</span>
      <span>{savingLabel}</span>
    </div>
  )
  if (status === 'saved') return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8">
      <span>✓</span>
      <span>{savedLabel}{lastSaved ? ` ${fmt(lastSaved)}` : ''}</span>
    </div>
  )
  if (status === 'error') return (
    <button onClick={onSave}
      className="flex items-center gap-1.5 text-xs text-red-400 px-3 py-2 rounded-lg border border-red-500/25 bg-red-500/8 hover:bg-red-500/15 transition-colors">
      <span>✕</span>
      <span>{retryLabel}</span>
    </button>
  )
  return (
    <button onClick={onSave}
      className="flex items-center gap-1.5 text-xs text-yellow-400 px-3 py-2 rounded-lg border border-yellow-500/25 bg-yellow-500/8 hover:bg-yellow-500/15 transition-colors font-bold">
      <span>💾</span>
      <span>{saveLabel}</span>
    </button>
  )
}
