'use client'
// components/builder/linkedin/LinkedInImportModal.tsx
//
// Multi-step modal that lets users import their LinkedIn profile into the CV builder.
// No OAuth — user copies their profile text, Claude extracts structured data,
// user reviews a diff preview and picks what to merge.
//
// Steps:
//   1. 'guide'   — animated instructions on how to copy LinkedIn profile text
//   2. 'paste'   — textarea for the pasted text, with char counter
//   3. 'loading' — AI extraction in progress
//   4. 'preview' — field-by-field diff: current vs extracted, toggleable per section
//   5. 'done'    — success summary

import { useState, useRef, useCallback, useEffect } from 'react'
import { useCVStore, normalizeCV } from '@/lib/store'
import type { CVData } from '@/types/cv'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'guide' | 'paste' | 'loading' | 'preview' | 'done'

interface ExtractedSection {
  key:     keyof CVData
  label:   string
  labelEn: string
  icon:    string
  count:   number   // items found by AI
  enabled: boolean  // whether user wants to merge this section
}

interface Props {
  isEn:    boolean
  onClose: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Small sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className={[
      'w-2 h-2 rounded-full transition-all duration-300',
      done   ? 'bg-yellow-400' :
      active ? 'bg-yellow-400 scale-125 shadow-[0_0_6px_rgba(201,168,76,0.6)]' :
               'bg-white/15',
    ].join(' ')} />
  )
}

function GuideStep({ step, icon, title, desc }: { step: number; icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3.5 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#1C1C28] border border-white/8 flex items-center justify-center text-base">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-black text-yellow-500/70 tabular-nums">0{step}</span>
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function SectionToggle({
  section, isEn,
  onChange,
}: {
  section: ExtractedSection
  isEn:   boolean
  onChange: (key: keyof CVData, enabled: boolean) => void
}) {
  const label = isEn ? section.labelEn : section.label
  const count = section.count

  return (
    <button
      onClick={() => onChange(section.key, !section.enabled)}
      className={[
        'flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-start transition-all duration-150',
        section.enabled
          ? 'border-yellow-500/40 bg-yellow-500/8 text-white'
          : 'border-white/8 bg-white/[0.02] text-gray-500',
      ].join(' ')}
    >
      <span className="text-xl flex-shrink-0">{section.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold">{label}</div>
        <div className={`text-xs mt-0.5 ${section.enabled ? 'text-yellow-400/60' : 'text-gray-700'}`}>
          {count > 0
            ? isEn ? `${count} item${count !== 1 ? 's' : ''} found` : `${count} ${count === 1 ? 'عنصر' : 'عناصر'} مستخرجة`
            : isEn ? 'Nothing found' : 'لم يُعثر على بيانات'}
        </div>
      </div>
      {/* Toggle pip */}
      <div className={[
        'flex-shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative',
        section.enabled ? 'bg-yellow-500' : 'bg-white/10',
      ].join(' ')}>
        <div className={[
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
          section.enabled ? 'left-5' : 'left-0.5',
        ].join(' ')} />
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────────────────────

export function LinkedInImportModal({ isEn, onClose }: Props) {
  const { cv, loadCV } = useCVStore()

  const [step,        setStep]        = useState<Step>('guide')
  const [text,        setText]        = useState('')
  const [error,       setError]       = useState('')
  const [extracted,   setExtracted]   = useState<Partial<CVData> | null>(null)
  const [sections,    setSections]    = useState<ExtractedSection[]>([])
  const [mergedCount, setMergedCount] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when reaching paste step
  useEffect(() => {
    if (step === 'paste') setTimeout(() => textareaRef.current?.focus(), 100)
  }, [step])

  // ── Detect LinkedIn profile text from clipboard on mount ──────────────
  const tryPaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip.length > 100 && (
        clip.includes('Experience') || clip.includes('خبرة') ||
        clip.includes('Education')  || clip.includes('تعليم') ||
        clip.includes('Skills')     || clip.includes('مهارات') ||
        clip.includes('About')      || clip.includes('عن')
      )) {
        setText(clip)
      }
    } catch {
      // Clipboard API not available or denied — fine, user pastes manually
    }
  }, [])

  const handleGoToPaste = () => {
    setStep('paste')
    tryPaste()
  }

  // ── Submit text for AI extraction ─────────────────────────────────────
  const handleExtract = async () => {
    const trimmed = text.trim()
    if (trimmed.length < 50) {
      setError(isEn ? 'Please paste more text from your LinkedIn profile.' : 'الصق المزيد من محتوى ملفك الشخصي على LinkedIn.')
      return
    }
    setError('')
    setStep('loading')

    try {
      const res = await fetch('/api/linkedin/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? (isEn ? 'Extraction failed. Please try again.' : 'فشل الاستخراج. حاول مرة أخرى.'))
        setStep('paste')
        return
      }

      const cvData = data.cv as Partial<CVData>
      setExtracted(cvData)

      // Build section summary for the preview step
      const sectionDefs: ExtractedSection[] = [
        {
          key:     'personal',
          label:   'المعلومات الشخصية',
          labelEn: 'Personal Info',
          icon:    '👤',
          count:   countPersonalFields(cvData.personal),
          enabled: true,
        },
        {
          key:     'experience',
          label:   'الخبرة المهنية',
          labelEn: 'Work Experience',
          icon:    '💼',
          count:   cvData.experience?.length ?? 0,
          enabled: (cvData.experience?.length ?? 0) > 0,
        },
        {
          key:     'education',
          label:   'التعليم',
          labelEn: 'Education',
          icon:    '🎓',
          count:   cvData.education?.length ?? 0,
          enabled: (cvData.education?.length ?? 0) > 0,
        },
        {
          key:     'skills',
          label:   'المهارات',
          labelEn: 'Skills',
          icon:    '⚡',
          count:   cvData.skills?.length ?? 0,
          enabled: (cvData.skills?.length ?? 0) > 0,
        },
        {
          key:     'languages',
          label:   'اللغات',
          labelEn: 'Languages',
          icon:    '🌐',
          count:   cvData.languages?.length ?? 0,
          enabled: (cvData.languages?.length ?? 0) > 0,
        },
        {
          key:     'certificates',
          label:   'الشهادات',
          labelEn: 'Certifications',
          icon:    '🏆',
          count:   cvData.certificates?.length ?? 0,
          enabled: (cvData.certificates?.length ?? 0) > 0,
        },
      ]

      setSections(sectionDefs)
      setStep('preview')
    } catch {
      setError(isEn ? 'Connection error. Check your internet and try again.' : 'خطأ في الاتصال. تحقق من اتصالك وحاول مرة أخرى.')
      setStep('paste')
    }
  }

  // ── Apply selected sections to the CV store ───────────────────────────
  const handleApply = () => {
    if (!extracted) return

    // Build merged CV: start with current cv, overlay enabled sections
    const merged: Partial<CVData> = { ...cv }

    for (const s of sections) {
      if (!s.enabled) continue
      if (s.key === 'personal' && extracted.personal) {
        // Merge personal fields: only overwrite non-empty extracted values
        merged.personal = mergePersonal(cv.personal, extracted.personal)
      } else if (s.key !== 'personal') {
        const val = extracted[s.key]
        if (Array.isArray(val) && val.length > 0) {
          ;(merged as any)[s.key] = val
        }
      }
    }

    loadCV(merged)

    // Count how many sections were merged
    setMergedCount(sections.filter(s => s.enabled && s.count > 0).length)
    setStep('done')
  }

  const toggleSection = useCallback((key: keyof CVData, enabled: boolean) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, enabled } : s))
  }, [])

  const totalFound = sections.reduce((sum, s) => sum + s.count, 0)
  const charCount  = text.length

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg bg-[#0E0E18] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0077B5]/15 border border-[#0077B5]/30 flex items-center justify-center flex-shrink-0">
              {/* LinkedIn "in" logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077B5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                {isEn ? 'Import from LinkedIn' : 'استيراد من LinkedIn'}
              </h2>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {isEn ? 'AI-powered profile extraction' : 'استخراج ذكي بالذكاء الاصطناعي'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step progress dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {(['guide','paste','loading','preview','done'] as Step[]).map((s, i) => (
                <StepDot key={s} active={step === s} done={
                  (['guide','paste','loading','preview','done'] as Step[]).indexOf(step) > i
                } />
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-200 hover:bg-white/8 transition-all text-lg leading-none"
              aria-label={isEn ? 'Close' : 'إغلاق'}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92dvh - 80px)' }}>

          {/* ══ GUIDE step ════════════════════════════════════════ */}
          {step === 'guide' && (
            <div className="px-5 py-5 space-y-5">
              <div className="bg-[#0077B5]/8 border border-[#0077B5]/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isEn
                    ? 'LinkedIn doesn\'t allow third-party apps to read your full profile. Instead, copy your profile text and paste it here — Claude will extract everything automatically.'
                    : 'LinkedIn لا يسمح لتطبيقات خارجية بقراءة ملفك الشخصي كاملاً. بدلاً من ذلك، انسخ نص ملفك والصقه هنا — سيستخرج Claude كل شيء تلقائياً.'}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">
                  {isEn ? 'How to copy your LinkedIn profile' : 'كيفية نسخ ملفك الشخصي على LinkedIn'}
                </p>

                <div className="space-y-3.5">
                  <GuideStep
                    step={1} icon="🌐"
                    title={isEn ? 'Open your LinkedIn profile' : 'افتح ملفك الشخصي على LinkedIn'}
                    desc={isEn
                      ? 'Go to linkedin.com and click on your profile picture or "Me" → "View Profile"'
                      : 'اذهب إلى linkedin.com وانقر على صورتك الشخصية أو "أنا" ← "عرض الملف الشخصي"'}
                  />
                  <GuideStep
                    step={2} icon="⌨️"
                    title={isEn ? 'Select all text on the page' : 'حدد كل النص في الصفحة'}
                    desc={isEn
                      ? 'Press Ctrl+A (Windows/Linux) or ⌘+A (Mac) to select everything on the page'
                      : 'اضغط Ctrl+A على ويندوز/لينكس أو ⌘+A على ماك لتحديد كل شيء في الصفحة'}
                  />
                  <GuideStep
                    step={3} icon="📋"
                    title={isEn ? 'Copy the selection' : 'انسخ التحديد'}
                    desc={isEn
                      ? 'Press Ctrl+C (or ⌘+C) to copy, then come back here and click "Paste & Extract"'
                      : 'اضغط Ctrl+C (أو ⌘+C) للنسخ، ثم عد هنا وانقر "لصق واستخراج"'}
                  />
                </div>

                <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3.5">
                  <p className="text-xs text-yellow-400/80 font-bold mb-1">
                    {isEn ? '💡 Alternative: LinkedIn PDF export' : '💡 بديل: تصدير PDF من LinkedIn'}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {isEn
                      ? 'Go to your profile → "More" → "Save to PDF", open the PDF, select all text (Ctrl+A) and copy.'
                      : 'اذهب لملفك الشخصي → "المزيد" → "حفظ بصيغة PDF"، افتح الـ PDF، حدد كل النص (Ctrl+A) وانسخه.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleGoToPaste}
                className="w-full py-3.5 rounded-xl bg-[#0077B5] hover:bg-[#006097] active:bg-[#005580] text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0077B5]/20"
              >
                <span>📋</span>
                {isEn ? 'I\'ve copied — Paste & Extract' : 'نسخت — لصق واستخراج'}
              </button>
            </div>
          )}

          {/* ══ PASTE step ════════════════════════════════════════ */}
          {step === 'paste' && (
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-widest font-bold mb-2">
                  {isEn ? 'Paste LinkedIn profile text' : 'الصق نص ملفك الشخصي على LinkedIn'}
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => { setText(e.target.value); setError('') }}
                    placeholder={isEn
                      ? 'Paste the copied text from your LinkedIn profile here…\n\nThe more you paste, the better the extraction. Include your About section, Work Experience, Education, Skills, and Certifications.'
                      : 'الصق النص المنسوخ من ملفك الشخصي على LinkedIn هنا…\n\nكلما نسخت أكثر، كانت النتائج أفضل. أضف قسم "عن"، والخبرات، والتعليم، والمهارات، والشهادات.'}
                    rows={10}
                    dir="auto"
                    className="w-full bg-[#13131E] border border-white/8 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-700 focus:border-[#0077B5]/50 focus:outline-none resize-none transition-colors leading-relaxed"
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                  {/* Char counter */}
                  <div className="absolute bottom-3 end-3 text-[10px] text-gray-700 tabular-nums">
                    {charCount.toLocaleString()} / 20,000
                  </div>
                </div>

                {error && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2.5">
                    <span className="flex-shrink-0">⚠</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('guide')}
                  className="px-4 py-3 rounded-xl border border-white/8 text-gray-400 text-sm hover:border-white/15 hover:text-gray-200 transition-all"
                >
                  {isEn ? '← Back' : '→ رجوع'}
                </button>
                <button
                  onClick={handleExtract}
                  disabled={charCount < 50}
                  className="flex-1 py-3 rounded-xl bg-[#0077B5] hover:bg-[#006097] text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#0077B5]/15"
                >
                  <span className="text-base">✦</span>
                  {isEn ? 'Extract with AI' : 'استخراج بالذكاء الاصطناعي'}
                </button>
              </div>

              <button
                onClick={async () => {
                  try {
                    const clip = await navigator.clipboard.readText()
                    setText(clip)
                    setError('')
                  } catch {
                    setError(isEn ? 'Could not access clipboard. Please paste manually (Ctrl+V).' : 'تعذر الوصول إلى الحافظة. الصق يدوياً (Ctrl+V).')
                  }
                }}
                className="w-full py-2.5 rounded-xl border border-white/6 text-xs text-gray-600 hover:border-white/12 hover:text-gray-400 transition-all"
              >
                {isEn ? '📋 Auto-paste from clipboard' : '📋 لصق تلقائي من الحافظة'}
              </button>
            </div>
          )}

          {/* ══ LOADING step ══════════════════════════════════════ */}
          {step === 'loading' && (
            <div className="px-5 py-10 flex flex-col items-center gap-6">
              {/* Animated LinkedIn + AI logo */}
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-2xl bg-[#0077B5]/15 border border-[#0077B5]/30 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#0077B5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                {/* Orbit ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-400"
                  style={{ animation: 'spin 1.2s linear infinite' }}
                />
                {/* AI badge */}
                <div className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-black text-black shadow-lg">
                  ✦
                </div>
              </div>

              <div className="text-center">
                <p className="text-base font-black text-white mb-1">
                  {isEn ? 'Extracting your profile…' : 'جاري استخراج ملفك الشخصي…'}
                </p>
                <p className="text-xs text-gray-600">
                  {isEn ? 'Claude is reading your LinkedIn text and structuring your CV' : 'يقرأ Claude نص LinkedIn ويرتب بياناتك المهنية'}
                </p>
              </div>

              {/* Animated progress dots */}
              <div className="flex gap-1.5">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-yellow-500"
                    style={{ animation: `pulse 1.2s ease-in-out ${delay}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ══ PREVIEW step ══════════════════════════════════════ */}
          {step === 'preview' && (
            <div className="px-5 py-5 space-y-4">
              {/* Summary banner */}
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3.5 flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">✦</span>
                <div>
                  <p className="text-sm font-bold text-emerald-400">
                    {isEn ? `Found ${totalFound} data points!` : `تم استخراج ${totalFound} عنصر!`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEn
                      ? 'Choose which sections to merge into your CV. Existing data will be updated.'
                      : 'اختر الأقسام التي تريد دمجها في سيرتك الذاتية. سيتم تحديث البيانات الموجودة.'}
                  </p>
                </div>
              </div>

              {/* Section toggles */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                  {isEn ? 'Select sections to import' : 'اختر الأقسام للاستيراد'}
                </p>
                {sections.map(s => (
                  <SectionToggle key={s.key} section={s} isEn={isEn} onChange={toggleSection} />
                ))}
              </div>

              {/* Select all / none */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSections(p => p.map(s => ({ ...s, enabled: s.count > 0 })))}
                  className="flex-1 py-2 text-xs text-gray-500 border border-white/6 rounded-lg hover:border-white/12 hover:text-gray-300 transition-all"
                >
                  {isEn ? '✓ Select all' : '✓ تحديد الكل'}
                </button>
                <button
                  onClick={() => setSections(p => p.map(s => ({ ...s, enabled: false })))}
                  className="flex-1 py-2 text-xs text-gray-500 border border-white/6 rounded-lg hover:border-white/12 hover:text-gray-300 transition-all"
                >
                  {isEn ? '○ Deselect all' : '○ إلغاء الكل'}
                </button>
              </div>

              {/* Apply button */}
              <button
                onClick={handleApply}
                disabled={!sections.some(s => s.enabled)}
                className="w-full py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-black text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
              >
                <span>⚡</span>
                {isEn ? 'Apply to my CV' : 'تطبيق على سيرتي الذاتية'}
              </button>

              <button
                onClick={() => setStep('paste')}
                className="w-full py-2.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                {isEn ? '← Paste different text' : '→ لصق نص مختلف'}
              </button>
            </div>
          )}

          {/* ══ DONE step ═════════════════════════════════════════ */}
          {step === 'done' && (
            <div className="px-5 py-10 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
                ✓
              </div>
              <div>
                <p className="text-lg font-black text-white mb-1">
                  {isEn ? 'LinkedIn imported!' : 'تم الاستيراد من LinkedIn!'}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {isEn
                    ? `${mergedCount} section${mergedCount !== 1 ? 's' : ''} merged into your CV. Review and refine the details in the form.`
                    : `تم دمج ${mergedCount} ${mergedCount === 1 ? 'قسم' : 'أقسام'} في سيرتك الذاتية. راجع التفاصيل وحسّنها في النموذج.`}
                </p>
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3.5 w-full text-start">
                <p className="text-xs text-yellow-400 font-bold mb-1">
                  {isEn ? '✦ AI tip' : '✦ نصيحة الذكاء الاصطناعي'}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isEn
                    ? 'Use the AI buttons in each section to enhance your descriptions with stronger action verbs and quantified achievements.'
                    : 'استخدم أزرار الذكاء الاصطناعي في كل قسم لتحسين توصيفاتك بأفعال أقوى وإنجازات مرقّمة.'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm transition-all shadow-lg shadow-yellow-500/20"
              >
                {isEn ? 'View my CV ✓' : 'عرض سيرتي الذاتية ✓'}
              </button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function countPersonalFields(p: Partial<CVData['personal']> | undefined): number {
  if (!p) return 0
  return [
    p.fullName || p.fullNameEn,
    p.jobTitle || p.jobTitleEn,
    p.email,
    p.phone,
    p.location || p.locationEn,
    p.summary || p.summaryEn,
    p.linkedin,
    p.website,
  ].filter(Boolean).length
}

function mergePersonal(
  current: CVData['personal'],
  extracted: Partial<CVData['personal']>,
): CVData['personal'] {
  // Overlay extracted values only where they are non-empty
  const merged = { ...current }
  const fields = Object.keys(extracted) as Array<keyof CVData['personal']>
  for (const k of fields) {
    const val = extracted[k]
    if (val && typeof val === 'string' && val.trim() !== '') {
      ;(merged as any)[k] = val
    }
  }
  return merged
}
