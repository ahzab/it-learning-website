'use client'
// components/layout/LanguageSwitcher.tsx

import { useState, useRef, useEffect } from 'react'
import { useT } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n'

const LANGS: { id: Locale; flag: string; short: string; label: string }[] = [
  { id: 'ar', flag: '🇸🇦', short: 'ع',  label: 'العربية' },
  { id: 'en', flag: '🇬🇧', short: 'EN', label: 'English'  },
  { id: 'fr', flag: '🇫🇷', short: 'FR', label: 'Français' },
]

export function LanguageSwitcher() {
  const { locale, setLocale, t, isRTL } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGS.find(l => l.id === locale)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
        style={{
          background:  'rgba(255,255,255,0.04)',
          borderColor: open ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)',
          color:       open ? '#C9A84C' : '#6B6672',
        }}
        aria-label={t.langSwitcher.label}
        aria-expanded={open}>
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="font-mono tracking-wider">{current.short}</span>
        <svg viewBox="0 0 10 6" className="w-2.5 h-2.5 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none', fill: 'currentColor' }}>
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 rounded-xl border overflow-hidden z-[200] min-w-[140px]"
          style={{
            background:  '#0D0D14',
            borderColor: 'rgba(201,168,76,0.2)',
            boxShadow:   '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)',
            // Dropdown opens toward the center of the screen
            ...(isRTL ? { right: 0 } : { left: 0 }),
          }}>
          {LANGS.map((lang, i) => {
            const isActive = lang.id === locale
            return (
              <button
                key={lang.id}
                onClick={() => { setLocale(lang.id); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                style={{
                  background:   isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                  color:        isActive ? '#C9A84C' : '#9994A0',
                  borderBottom: i < LANGS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  textAlign:    'left', // Language names always LTR-aligned in dropdown
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <span className="text-base leading-none">{lang.flag}</span>
                <span className={isActive ? 'font-bold' : 'font-semibold'}>{lang.label}</span>
                {isActive && (
                  <span className="text-[10px]" style={{ marginInlineStart:'auto', color:'#C9A84C' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
