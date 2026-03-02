'use client'
// components/linkedin/LinkedInImport.tsx
// Full-screen modal for importing CV data from LinkedIn.
// Two modes:
//   1. Paste a LinkedIn profile URL (for public profiles)
//   2. Upload the LinkedIn data export ZIP (most reliable, always works)

import { useState, useRef, useCallback, useEffect } from 'react'
import { useCVStore, normalizeCV } from '@/lib/store'
import { CVData } from '@/types/cv'

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'choose' | 'url' | 'zip' | 'paste' | 'loading' | 'preview' | 'error'

interface ImportMeta {
  mode: 'url' | 'zip'
  fieldsFound: {
    personal: number
    experience: number
    education: number
    skills: number
  }
}

interface ImportResult {
  cv: Partial<CVData>
  meta: ImportMeta
}

// ── Merge conflict field component ────────────────────────────────────────────

function FieldPreview({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest">{label}</div>
        <div className="text-sm text-gray-200 leading-snug truncate">{value}</div>
      </div>
    </div>
  )
}

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/4 rounded-xl border border-white/8">
      <span className="text-lg font-black text-yellow-400">{count}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

const EXPORT_STEPS = [
  { n: 1, text: 'اذهب إلى LinkedIn → الإعدادات والخصوصية' },
  { n: 2, text: 'خصوصية البيانات → الحصول على نسخة من بياناتك' },
  { n: 3, text: 'اختر "كل بيانات LinkedIn" ثم اطلب الأرشيف' },
  { n: 4, text: 'ستصلك رسالة بالبريد خلال 24 ساعة — حمّل ملف ZIP' },
]

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  isEn?: boolean
  onClose: () => void
}

export function LinkedInImport({ isEn, onClose }: Props) {
  const loadCV = useCVStore(s => s.loadCV)
  const currentCV = useCVStore(s => s.cv)

  const [mode, setMode]           = useState<Mode>('choose')
  const [url, setUrl]             = useState('')
  const [urlError, setUrlError]   = useState('')
  const [dragOver, setDragOver]   = useState(false)
  const [fileName, setFileName]   = useState('')
  const [result, setResult]       = useState<ImportResult | null>(null)
  const [error, setError]         = useState('')
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('merge')

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Submit URL ──────────────────────────────────────────────────────────────

  const submitUrl = useCallback(async () => {
    setUrlError('')
    const trimmed = url.trim()

    if (!trimmed) {
      setUrlError(isEn ? 'Please enter a URL' : 'أدخل الرابط')
      return
    }
    if (!trimmed.includes('linkedin.com/in/')) {
      setUrlError(isEn ? 'Must be a linkedin.com/in/... URL' : 'يجب أن يكون رابط linkedin.com/in/...')
      return
    }

    setMode('loading')

    try {
      const res = await fetch('/api/linkedin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data = await res.json()

      // Server tells us URL mode is unavailable (LinkedIn blocks scraping)
      // Fall back to the paste mode gracefully, carrying the URL as context
      if (res.status === 422 && data.error === 'url_mode_unavailable') {
        setMode('choose')
        setUrlError(
          isEn
            ? 'LinkedIn blocks automated access. Please copy your profile text manually instead.'
            : 'LinkedIn يمنع الوصول الآلي. يرجى نسخ نص ملفك الشخصي يدوياً.'
        )
        return
      }

      if (!res.ok || !data.ok) {
        setError(data.error || (isEn ? 'Import failed' : 'فشل الاستيراد'))
        setMode('error')
        return
      }

      setResult(data)
      setMode('preview')
    } catch (e) {
      setError(isEn ? 'Network error. Please try again.' : 'خطأ في الشبكة. حاول مجدداً.')
      setMode('error')
    }
  }, [url, isEn])

  // ── Submit ZIP ──────────────────────────────────────────────────────────────

  const submitZip = useCallback(async (file: File) => {
    setFileName(file.name)
    setMode('loading')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/linkedin/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error || (isEn ? 'Import failed' : 'فشل الاستيراد'))
        setMode('error')
        return
      }

      setResult(data)
      setMode('preview')
    } catch (e) {
      setError(isEn ? 'Network error. Please try again.' : 'خطأ في الشبكة. حاول مجدداً.')
      setMode('error')
    }
  }, [isEn])

  // ── Apply import ────────────────────────────────────────────────────────────

  const applyImport = useCallback(() => {
    if (!result) return

    if (mergeMode === 'replace') {
      // Completely replace current CV with LinkedIn data
      loadCV(result.cv)
    } else {
      // Smart merge: LinkedIn data fills empty fields, doesn't overwrite existing
      const merged: Partial<CVData> = {
        ...currentCV,
        personal: {
          ...currentCV.personal,
          // Only fill personal fields that are currently empty
          ...Object.fromEntries(
            Object.entries(result.cv.personal || {}).filter(([key, val]) => {
              const current = (currentCV.personal as Record<string, unknown>)[key]
              return val && (!current || current === '')
            })
          ),
        },
        // Append experience/education/skills that don't already exist
        experience: mergeArrays(
          currentCV.experience,
          (result.cv.experience || []) as any[],
          (a, b) => a.company === b.company && a.jobTitle === b.jobTitle
        ),
        education: mergeArrays(
          currentCV.education,
          (result.cv.education || []) as any[],
          (a, b) => a.institution === b.institution && a.degree === b.degree
        ),
        skills: mergeArrays(
          currentCV.skills,
          (result.cv.skills || []) as any[],
          (a, b) => a.name?.toLowerCase() === b.name?.toLowerCase()
        ),
        languages: mergeArrays(
          currentCV.languages,
          (result.cv.languages || []) as any[],
          (a, b) => a.name?.toLowerCase() === b.name?.toLowerCase()
        ),
        certificates: mergeArrays(
          currentCV.certificates,
          (result.cv.certificates || []) as any[],
          (a, b) => a.name === b.name
        ),
      }
      loadCV(merged)
    }

    onClose()
  }, [result, mergeMode, currentCV, loadCV, onClose])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function mergeArrays<T>(existing: T[], incoming: T[], isDuplicate: (a: T, b: T) => boolean): T[] {
    const newItems = incoming.filter(inc =>
      !existing.some(ex => isDuplicate(ex, inc))
    )
    return [...existing, ...newItems]
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.name.endsWith('.zip')) submitZip(file)
  }, [submitZip])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) submitZip(file)
  }, [submitZip])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full sm:max-w-lg bg-[#111118] border border-white/10 sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0A66C2]/15 border border-[#0A66C2]/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <LinkedInIcon />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                {isEn ? 'Import from LinkedIn' : 'استيراد من LinkedIn'}
              </h2>
              {mode !== 'choose' && (
                <button onClick={() => { setMode('choose'); setError(''); setUrl('') }}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                  {isEn ? '← Back' : '← رجوع'}
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-all text-lg leading-none">
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 60px)' }}>

          {/* ═══ CHOOSE MODE ══════════════════════════════════════════════ */}
          {mode === 'choose' && (
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                {isEn
                  ? 'Choose how to import your LinkedIn profile data:'
                  : 'اختر طريقة استيراد بيانات ملفك الشخصي من LinkedIn:'}
              </p>

              {/* urlError shown here when URL mode fell back */}
              {urlError && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                  <span className="text-amber-400 flex-shrink-0 mt-0.5">⚠</span>
                  <p className="text-xs text-amber-400/80 leading-relaxed">{urlError}</p>
                </div>
              )}

              {/* Option 1: Copy & Paste — quickest, always works */}
              <button
                onClick={() => { setUrlError(''); setMode('paste' as any) }}
                className="w-full text-start p-4 rounded-xl border border-[#0A66C2]/30 hover:border-[#0A66C2]/60 bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">📋</span>
                  <div>
                    <div className="font-bold text-sm text-[#70B5F9]">
                      {isEn ? 'Copy & Paste Profile Text (Fastest)' : 'نسخ ولصق نص الملف (الأسرع)'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {isEn
                        ? 'Select all text on your LinkedIn profile page (Ctrl+A → Ctrl+C) and paste here.'
                        : 'حدد كل نص صفحة ملفك على LinkedIn (Ctrl+A ← Ctrl+C) والصقه هنا.'}
                    </div>
                    <div className="text-[10px] text-emerald-500/80 mt-1 font-semibold">
                      ✓ {isEn ? 'Works with all profiles, no account needed' : 'يعمل مع كل الملفات، لا حاجة لحساب'}
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: ZIP export */}
              <button
                onClick={() => { setUrlError(''); setMode('zip') }}
                className="w-full text-start p-4 rounded-xl border border-white/8 hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">📦</span>
                  <div>
                    <div className="font-bold text-sm text-white group-hover:text-[#70B5F9] transition-colors">
                      {isEn ? 'Upload LinkedIn Data Export' : 'رفع ملف تصدير LinkedIn'}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {isEn
                        ? 'Download your data archive from LinkedIn settings and upload the ZIP here.'
                        : 'حمّل أرشيف بياناتك من إعدادات LinkedIn وارفع ملف ZIP هنا.'}
                    </div>
                    <div className="text-[10px] text-yellow-500/70 mt-1">
                      ⏱ {isEn ? 'LinkedIn takes up to 24h to prepare the archive' : 'يستغرق LinkedIn حتى ٢٤ ساعة لإعداد الأرشيف'}
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 3: URL (inform about limitation) */}
              <button
                onClick={() => { setUrlError(''); setMode('url') }}
                className="w-full text-start p-4 rounded-xl border border-white/6 hover:border-white/12 transition-all group opacity-60 hover:opacity-80"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">🔗</span>
                  <div>
                    <div className="font-bold text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                      {isEn ? 'Paste Profile URL' : 'رابط الملف الشخصي'}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {isEn
                        ? 'Public profiles only. LinkedIn may block automated access.'
                        : 'للملفات العامة فقط. قد يمنع LinkedIn الوصول الآلي.'}
                    </div>
                  </div>
                </div>
              </button>

              {/* Privacy note */}
              <div className="flex items-start gap-2 p-3 bg-white/3 rounded-xl border border-white/6">
                <span className="text-sm flex-shrink-0 mt-0.5">🔒</span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {isEn
                    ? 'Your data is processed privately and never stored on our servers. It goes directly from your browser to Claude AI.'
                    : 'بياناتك تُعالج بشكل خاص ولا تُخزّن على خوادمنا. تذهب مباشرة من متصفحك إلى Claude AI.'}
                </p>
              </div>
            </div>
          )}

          {/* ═══ URL MODE ════════════════════════════════════════════════ */}
          {mode === 'url' && (
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {isEn ? 'LinkedIn Profile URL' : 'رابط الملف الشخصي'}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setUrlError('') }}
                  onKeyDown={e => e.key === 'Enter' && submitUrl()}
                  placeholder="https://www.linkedin.com/in/your-name"
                  dir="ltr"
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#0A66C2]/60 focus:outline-none transition-colors"
                  autoFocus
                />
                {urlError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <span>⚠</span> {urlError}
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <p className="text-[11px] text-amber-400/80 leading-relaxed">
                  {isEn
                    ? 'Make sure your LinkedIn profile is set to public: LinkedIn → Me → View Profile → Edit public profile & URL → toggle "Your profile\'s public visibility" to On'
                    : 'تأكد أن ملفك الشخصي عام: LinkedIn ← أنا ← عرض الملف الشخصي ← تعديل الملف العام والرابط ← تشغيل "رؤية ملفك الشخصي العام"'}
                </p>
              </div>

              <button
                onClick={submitUrl}
                className="w-full py-3 rounded-xl bg-[#0A66C2] hover:bg-[#0D7BE5] active:bg-[#085DAB] text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <LinkedInIcon white />
                {isEn ? 'Import Profile' : 'استيراد الملف الشخصي'}
              </button>
            </div>
          )}

          {/* ═══ ZIP MODE ════════════════════════════════════════════════ */}
          {mode === 'zip' && (
            <div className="p-5 space-y-4">
              {/* How to export steps */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {isEn ? 'How to export your LinkedIn data' : 'كيف تصدّر بياناتك من LinkedIn'}
                </p>
                <div className="space-y-2">
                  {EXPORT_STEPS.map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0A66C2]/20 border border-[#0A66C2]/30 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-[#70B5F9]">
                        {n}
                      </div>
                      <p className="text-xs text-gray-500 leading-snug mt-0.5">
                        {isEn ? EXPORT_STEPS_EN[n - 1] : text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload zone */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={[
                  'w-full border-2 border-dashed rounded-xl p-6 text-center transition-all',
                  dragOver
                    ? 'border-[#0A66C2] bg-[#0A66C2]/10'
                    : 'border-white/15 hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/5 active:bg-[#0A66C2]/8',
                ].join(' ')}
              >
                <div className="text-3xl mb-2">📦</div>
                <p className="text-sm font-bold text-gray-300">
                  <span className="sm:hidden">{isEn ? 'Tap to upload ZIP' : 'اضغط لرفع ملف ZIP'}</span>
                  <span className="hidden sm:inline">{isEn ? 'Click or drag your LinkedIn export ZIP' : 'انقر أو اسحب ملف ZIP الخاص بك'}</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">{isEn ? 'The ZIP file LinkedIn sends to your email' : 'ملف ZIP الذي يرسله LinkedIn لبريدك الإلكتروني'}</p>
                {fileName && (
                  <p className="text-xs text-emerald-400 mt-2 font-semibold">✓ {fileName}</p>
                )}
              </button>

              <input ref={fileRef} type="file" accept=".zip" onChange={handleFileInput} className="hidden" />
            </div>
          )}

          {/* ═══ PASTE MODE ═══════════════════════════════════════════════ */}
          {mode === 'paste' && (
            <PasteMode isEn={isEn} onBack={() => setMode('choose')} onExtract={async (text) => {
              setMode('loading')
              try {
                const res = await fetch('/api/linkedin/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text }),
                })
                const data = await res.json()
                if (!res.ok || !data.ok) {
                  setError(data.error || (isEn ? 'Extraction failed' : 'فشل الاستخراج'))
                  setMode('error')
                  return
                }
                setResult(data)
                setMode('preview')
              } catch {
                setError(isEn ? 'Network error. Please try again.' : 'خطأ في الشبكة. حاول مجدداً.')
                setMode('error')
              }
            }} />
          )}

          {/* ═══ LOADING ═════════════════════════════════════════════════ */}
          {mode === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#0A66C2]/15 border border-[#0A66C2]/30 flex items-center justify-center">
                  <LinkedInIcon />
                </div>
                <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="animate-spin text-sm text-black font-black">⟳</span>
                </div>
              </div>
              <p className="font-bold text-white mb-1">
                {isEn ? 'Extracting your profile…' : 'جاري استخراج بياناتك…'}
              </p>
              <p className="text-xs text-gray-600">
                {isEn ? 'Claude AI is reading and structuring your LinkedIn data' : 'Claude AI يقرأ ويهيكل بيانات LinkedIn الخاصة بك'}
              </p>
            </div>
          )}

          {/* ═══ ERROR ═══════════════════════════════════════════════════ */}
          {mode === 'error' && (
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
                <span className="text-xl flex-shrink-0">⚠</span>
                <div>
                  <p className="text-sm font-bold text-red-400 mb-0.5">
                    {isEn ? 'Import failed' : 'فشل الاستيراد'}
                  </p>
                  <p className="text-xs text-red-400/70 leading-relaxed">{error}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('choose')}
                  className="py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:border-white/20 transition-colors">
                  {isEn ? 'Try another way' : 'جرّب طريقة أخرى'}
                </button>
                <button onClick={() => { setError(''); setMode(error.includes('URL') || error.includes('url') ? 'url' : 'zip') }}
                  className="py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#0D7BE5] text-white text-sm font-bold transition-all">
                  {isEn ? 'Try again' : 'حاول مجدداً'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ PREVIEW / CONFIRM ════════════════════════════════════════ */}
          {mode === 'preview' && result && (
            <div className="p-5 space-y-4">
              {/* Summary badges */}
              <div>
                <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <span>✓</span>
                  {isEn ? 'Successfully extracted your LinkedIn profile' : 'تم استخراج ملفك الشخصي من LinkedIn بنجاح'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <CountBadge count={result.meta.fieldsFound.personal} label={isEn ? 'personal fields' : 'حقل شخصي'} />
                  <CountBadge count={result.meta.fieldsFound.experience} label={isEn ? 'positions' : 'خبرة وظيفية'} />
                  <CountBadge count={result.meta.fieldsFound.education} label={isEn ? 'education' : 'تعليم'} />
                  <CountBadge count={result.meta.fieldsFound.skills} label={isEn ? 'skills' : 'مهارة'} />
                </div>
              </div>

              {/* Personal preview */}
              {result.cv.personal && (
                <div className="bg-white/3 rounded-xl p-3 space-y-0">
                  {Object.entries({
                    fullName:  { label: isEn ? 'Name'     : 'الاسم',     icon: '👤' },
                    jobTitle:  { label: isEn ? 'Title'    : 'المنصب',    icon: '💼' },
                    email:     { label: 'Email',                           icon: '✉️' },
                    location:  { label: isEn ? 'Location' : 'الموقع',    icon: '📍' },
                    linkedin:  { label: 'LinkedIn',                        icon: '🔗' },
                  }).map(([key, { label, icon }]) => (
                    <FieldPreview
                      key={key}
                      label={label}
                      icon={icon}
                      value={(result.cv.personal as Record<string, unknown>)?.[key] as string}
                    />
                  ))}
                </div>
              )}

              {/* Merge mode selector */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {isEn ? 'How to apply' : 'طريقة التطبيق'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'merge'   as const, label: isEn ? 'Smart merge'    : 'دمج ذكي',     desc: isEn ? 'Fill empty fields only' : 'يملأ الحقول الفارغة فقط', icon: '🔀' },
                    { val: 'replace' as const, label: isEn ? 'Replace all'    : 'استبدال كامل', desc: isEn ? 'Overwrite current CV'   : 'يستبدل السيرة الحالية',   icon: '🔄' },
                  ].map(({ val, label, desc, icon }) => (
                    <button
                      key={val}
                      onClick={() => setMergeMode(val)}
                      className={[
                        'p-3 rounded-xl border text-start transition-all',
                        mergeMode === val
                          ? 'border-yellow-500/50 bg-yellow-500/8 '
                          : 'border-white/8 hover:border-white/15',
                      ].join(' ')}
                    >
                      <div className="text-lg mb-1">{icon}</div>
                      <div className="text-xs font-bold text-white">{label}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <button
                onClick={applyImport}
                className="w-full py-3.5 rounded-xl bg-[#0A66C2] hover:bg-[#0D7BE5] active:bg-[#085DAB] text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0A66C2]/20"
              >
                <LinkedInIcon white />
                {isEn
                  ? (mergeMode === 'replace' ? 'Replace CV with LinkedIn data' : 'Merge LinkedIn data into CV')
                  : (mergeMode === 'replace' ? 'استبدال السيرة ببيانات LinkedIn' : 'دمج بيانات LinkedIn في السيرة')}
              </button>

              <p className="text-[10px] text-gray-700 text-center">
                {isEn ? 'You can edit everything after importing' : 'يمكنك تعديل كل شيء بعد الاستيراد'}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── SVG icon ──────────────────────────────────────────────────────────────────

// ── PasteMode sub-component ───────────────────────────────────────────────────

function PasteMode({
  isEn, onBack, onExtract,
}: {
  isEn: boolean
  onBack: () => void
  onExtract: (text: string) => void
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 100) }, [])

  const charCount = text.length
  const isReady   = charCount >= 50
  const isTooLong = charCount > 20000

  const handleAutoClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      setText(clip)
    } catch {
      // silently fail — user will paste manually
    }
  }

  return (
    <div className="p-5 space-y-4">
      {/* Instructions banner */}
      <div className="bg-[#0A66C2]/6 border border-[#0A66C2]/20 rounded-xl p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#70B5F9]">
          {isEn ? '📋 How to copy your LinkedIn profile' : '📋 كيفية نسخ ملفك على LinkedIn'}
        </p>
        <ol className="text-xs text-gray-500 leading-relaxed list-decimal list-inside space-y-1">
          <li>{isEn ? 'Go to linkedin.com → click your profile photo → View Profile' : 'اذهب إلى linkedin.com ← اضغط صورتك ← عرض الملف الشخصي'}</li>
          <li>{isEn ? 'Press Ctrl+A (Windows) or ⌘+A (Mac) to select all text' : 'اضغط Ctrl+A (ويندوز) أو ⌘+A (ماك) لتحديد كل النص'}</li>
          <li>{isEn ? 'Press Ctrl+C or ⌘+C to copy' : 'اضغط Ctrl+C أو ⌘+C للنسخ'}</li>
          <li>{isEn ? 'Come back here and paste (Ctrl+V / ⌘+V)' : 'عد هنا والصق (Ctrl+V / ⌘+V)'}</li>
        </ol>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-xs text-gray-600 uppercase tracking-widest font-bold mb-2">
          {isEn ? 'Paste LinkedIn profile text' : 'الصق نص ملفك الشخصي'}
        </label>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={isEn
            ? 'Paste the text copied from your LinkedIn profile here…'
            : 'الصق هنا النص المنسوخ من صفحة ملفك الشخصي على LinkedIn…'}
          rows={8}
          dir="auto"
          className="w-full bg-[#13131E] border border-white/8 rounded-xl px-4 py-3.5 text-xs text-white placeholder-gray-700 focus:border-[#0A66C2]/50 focus:outline-none resize-none transition-colors leading-relaxed"
          style={{ fontFamily: 'monospace' }}
        />
        <div className="flex justify-between items-center mt-1.5">
          <span className={`text-[10px] tabular-nums ${isTooLong ? 'text-red-400' : 'text-gray-700'}`}>
            {charCount.toLocaleString()} / 20,000
            {isTooLong && (isEn ? ' — too long' : ' — طويل جداً')}
          </span>
          <button
            onClick={handleAutoClipboard}
            className="text-[10px] text-[#70B5F9] hover:text-[#0A66C2] transition-colors"
          >
            {isEn ? '📋 Paste from clipboard' : '📋 لصق من الحافظة'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-white/8 text-gray-400 text-sm hover:border-white/15 hover:text-gray-200 transition-all"
        >
          {isEn ? '← Back' : '→ رجوع'}
        </button>
        <button
          onClick={() => onExtract(text.trim())}
          disabled={!isReady || isTooLong}
          className="flex-1 py-3 rounded-xl bg-[#0A66C2] hover:bg-[#0D7BE5] text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#0A66C2]/15"
        >
          <span>✦</span>
          {isEn ? 'Extract with AI' : 'استخراج بالذكاء الاصطناعي'}
        </button>
      </div>
    </div>
  )
}

function LinkedInIcon({ white }: { white?: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill={white ? 'white' : '#0A66C2'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

// ── English steps ─────────────────────────────────────────────────────────────

const EXPORT_STEPS_EN = [
  'Go to LinkedIn → Settings & Privacy',
  'Data Privacy → Get a copy of your data',
  'Select "All LinkedIn data" then request archive',
  'You\'ll get an email within 24h — download the ZIP file',
]
