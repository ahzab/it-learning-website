'use client'
// components/builder/TitleModal.tsx
// Self-contained — reads translations via useT() internally.
// Accepts legacy props (isEn, isRTL, label, placeholder, cancelLabel)
// but falls back to useT() when they're missing.

import { useT } from '@/lib/i18n/context'

interface Props {
  title:        string
  onClose:      () => void
  onSave:       (t: string) => void
  // legacy / optional — ignored if not provided
  isRTL?:       boolean
  isEn?:        boolean
  label?:       string
  placeholder?: string
  cancelLabel?: string
}

export function TitleModal({ title, onClose, onSave }: Props) {
  const { t, isRTL } = useT()
  const b = t.builder
  let val = title

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-black mb-4">{b.renameCv}</h3>
        <input
          className="w-full bg-[#1a1a26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
          defaultValue={title}
          placeholder={b.cvTitlePlaceholder}
          dir={isRTL ? 'rtl' : 'ltr'}
          autoFocus
          onChange={e => { val = e.target.value }}
          onKeyDown={e => { if (e.key === 'Enter') onSave(val) }}
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition-colors">
            {b.cancel}
          </button>
          <button onClick={() => onSave(val)}
            className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 transition-colors">
            {b.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
