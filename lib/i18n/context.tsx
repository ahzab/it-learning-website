'use client'
// lib/i18n/context.tsx — Language context, provider, and useT hook

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type Locale, type Translations } from './index'

// ── Types ─────────────────────────────────────────────────────────────
interface I18nContextValue {
  locale:    Locale
  t:         Translations
  setLocale: (l: Locale) => void
  isRTL:     boolean
}

// ── Context ───────────────────────────────────────────────────────────
const I18nContext = createContext<I18nContextValue>({
  locale:    'ar',
  t:         translations.ar,
  setLocale: () => {},
  isRTL:     true,
})

// ── Provider ──────────────────────────────────────────────────────────
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar')

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('seerti_locale') as Locale | null
      if (saved && saved in translations) setLocaleState(saved)
    } catch {}
  }, [])

  // Sync <html> attributes whenever locale changes
  useEffect(() => {
    const tr = translations[locale]
    const html = document.documentElement

    // Direction + language
    html.setAttribute('lang', tr.lang)
    html.setAttribute('dir',  tr.dir)

    // Font: Cairo is designed for both Arabic and Latin, but for LTR
    // locales we want Inter as primary with Cairo as fallback
    if (tr.dir === 'ltr') {
      document.body.style.fontFamily = "'Inter', 'Cairo', sans-serif"
      document.body.style.textAlign  = 'left'
    } else {
      document.body.style.fontFamily = "'Cairo', sans-serif"
      document.body.style.textAlign  = 'right'
    }
  }, [locale])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem('seerti_locale', l) } catch {}
  }

  const isRTL = translations[locale].dir === 'rtl'

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale, isRTL }}>
      {children}
    </I18nContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useT() {
  return useContext(I18nContext)
}
