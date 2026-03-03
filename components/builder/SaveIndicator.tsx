'use client'
// components/builder/SaveIndicator.tsx

type Status = 'idle' | 'saving' | 'saved' | 'error'

interface BuilderT {
  saving: string
  saved: string
  saveRetry: string
  save: string
}

interface Props {
  status:     Status
  lastSaved:  Date | null
  onSave:     () => void
  b:          BuilderT
  timeLocale: string
}

export function SaveIndicator({ status, lastSaved, onSave, b, timeLocale }: Props) {
  const fmt = (d: Date) =>
    d.toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })

  if (status === 'saving') return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 px-3 py-2 rounded-lg border border-white/8">
      <span className="animate-spin">⟳</span>
      <span>{b.saving}</span>
    </div>
  )
  if (status === 'saved') return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8">
      <span>✓</span>
      <span>{b.saved}{lastSaved ? ` ${fmt(lastSaved)}` : ''}</span>
    </div>
  )
  if (status === 'error') return (
    <button onClick={onSave}
      className="flex items-center gap-1.5 text-xs text-red-400 px-3 py-2 rounded-lg border border-red-500/25 bg-red-500/8 hover:bg-red-500/15 transition-colors">
      <span>✕</span>
      <span>{b.saveRetry}</span>
    </button>
  )
  return (
    <button onClick={onSave}
      className="flex items-center gap-1.5 text-xs text-yellow-400 px-3 py-2 rounded-lg border border-yellow-500/25 bg-yellow-500/8 hover:bg-yellow-500/15 transition-colors font-bold">
      <span>💾</span>
      <span>{b.save}</span>
    </button>
  )
}
