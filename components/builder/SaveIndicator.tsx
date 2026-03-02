'use client'
// components/builder/SaveIndicator.tsx
// Displays save status: idle / saving / saved / error + last saved time

interface Props {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  onSave: () => void
  isEn: boolean
}

export function SaveIndicator({ status, lastSaved, onSave, isEn }: Props) {
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(isEn ? 'en-US' : 'ar-MA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-2">
      {/* Status dot + label */}
      {status === 'saving' && (
        <span className="flex items-center gap-1.5 text-xs text-yellow-400">
          <span className="animate-spin inline-block">⟳</span>
          {isEn ? 'Saving…' : 'جاري الحفظ…'}
        </span>
      )}
      {status === 'saved' && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span>✓</span>
          {isEn ? 'Saved' : 'تم الحفظ'}
          {lastSaved && <span className="text-gray-600">{fmtTime(lastSaved)}</span>}
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1.5 text-xs text-red-400">
          <span>✕</span>
          {isEn ? 'Save failed' : 'فشل الحفظ'}
        </span>
      )}
      {status === 'idle' && lastSaved && (
        <span className="text-xs text-gray-600">
          {isEn ? `Saved ${fmtTime(lastSaved)}` : `محفوظ ${fmtTime(lastSaved)}`}
        </span>
      )}

      {/* Manual save button */}
      <button
        onClick={onSave}
        disabled={status === 'saving'}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:border-yellow-500/40 hover:text-yellow-400 hover:bg-yellow-500/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
      >
        💾 {isEn ? 'Save' : 'حفظ'}
      </button>
    </div>
  )
}
