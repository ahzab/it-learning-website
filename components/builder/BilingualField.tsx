'use client'
// components/builder/BilingualField.tsx
import { useState, useCallback } from 'react'
import { CVMode } from '@/types/cv'

interface Props {
  mode: CVMode
  labelAr: string
  labelEn?: string
  valueAr: string
  valueEn: string
  onChangeAr: (v: string) => void
  onChangeEn: (v: string) => void
  placeholderAr?: string
  placeholderEn?: string
  multiline?: boolean
  rows?: number
  fieldType?: string
}

export function BilingualField({
  mode, labelAr, labelEn,
  valueAr, valueEn, onChangeAr, onChangeEn,
  placeholderAr = '', placeholderEn = '',
  multiline = false, rows = 3, fieldType = 'text',
}: Props) {
  const [translating, setTranslating] = useState<'en' | 'ar' | null>(null)
  const [error, setError] = useState('')

  const translate = useCallback(async (dir: 'en' | 'ar') => {
    const source = dir === 'en' ? valueAr : valueEn
    if (!source?.trim()) return
    setTranslating(dir)
    setError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: dir === 'en' ? 'translate_to_en' : 'translate_to_ar',
          context: { text: source, fieldType },
        }),
      })
      if (!res.ok) { setError('Translation failed'); return }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'content_block_delta') full += parsed.delta?.text || ''
          } catch { /* skip */ }
        }
      }
      const clean = full.trim().replace(/^["']|["']$/g, '')
      if (dir === 'en') onChangeEn(clean)
      else onChangeAr(clean)
    } catch { setError('Network error') }
    finally { setTranslating(null) }
  }, [valueAr, valueEn, fieldType, onChangeAr, onChangeEn])

  const baseClass = 'w-full bg-[#111118] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-yellow-500 focus:outline-none transition-colors'

  function Input({ val, onChange, dir, placeholder }: { val: string; onChange: (v: string) => void; dir: 'rtl' | 'ltr'; placeholder: string }) {
    return multiline
      ? <textarea value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} dir={dir} className={baseClass + ' resize-none'} />
      : <input value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder} dir={dir} className={baseClass} />
  }

  // ── Arabic-only ─────────────────────────────────────────────────
  if (mode === 'ar') {
    return (
      <div>
        <label className="block text-xs text-gray-400 mb-1.5 font-semibold">{labelAr}</label>
        <Input val={valueAr} onChange={onChangeAr} dir="rtl" placeholder={placeholderAr} />
      </div>
    )
  }

  // ── English-only ────────────────────────────────────────────────
  if (mode === 'en') {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-gray-400 font-semibold">{labelEn || labelAr}</label>
          {valueAr && (
            <button onClick={() => translate('en')} disabled={!!translating}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors">
              {translating === 'en' ? <span className="animate-spin inline-block text-sm">✦</span> : '✦'}
              Translate from Arabic
            </button>
          )}
        </div>
        <Input val={valueEn} onChange={onChangeEn} dir="ltr" placeholder={placeholderEn || placeholderAr} />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    )
  }

  // ── Bilingual: side-by-side ────────────────────────────────────
  const bothFilled = !!valueAr && !!valueEn
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">{labelAr}</span>
          <span className="text-gray-700 text-xs">/</span>
          <span className="text-xs text-gray-500">{labelEn || labelAr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {bothFilled && <span className="text-xs text-emerald-500 font-semibold">✓ ثنائي</span>}
          {valueAr && !valueEn && (
            <button onClick={() => translate('en')} disabled={!!translating}
              className="flex items-center gap-1 text-xs bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 px-2 py-0.5 rounded transition-all disabled:opacity-50 font-semibold">
              {translating === 'en' ? <span className="animate-spin inline-block">✦</span> : '✦'} → EN
            </button>
          )}
          {valueEn && !valueAr && (
            <button onClick={() => translate('ar')} disabled={!!translating}
              className="flex items-center gap-1 text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 px-2 py-0.5 rounded transition-all disabled:opacity-50 font-semibold">
              {translating === 'ar' ? <span className="animate-spin inline-block">✦</span> : '✦'} → AR
            </button>
          )}
          {bothFilled && (
            <button onClick={() => translate('en')} disabled={!!translating}
              className="text-xs text-gray-600 hover:text-blue-400 disabled:opacity-50 transition-colors">
              {translating ? <span className="animate-spin inline-block text-xs">✦</span> : '↺ EN'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <span className="absolute top-2.5 right-2.5 text-xs text-gray-700 pointer-events-none select-none z-10 font-bold">AR</span>
          <Input val={valueAr} onChange={onChangeAr} dir="rtl" placeholder={placeholderAr} />
        </div>
        <div className="relative">
          <span className="absolute top-2.5 left-2.5 text-xs text-gray-700 pointer-events-none select-none z-10 font-bold">EN</span>
          <Input val={valueEn} onChange={onChangeEn} dir="ltr" placeholder={placeholderEn || placeholderAr} />
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
