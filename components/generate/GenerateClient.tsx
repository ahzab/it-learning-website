'use client'
// components/generate/GenerateClient.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { AIErrorModal } from '@/components/ui/AIErrorModal'
import { useRouter } from 'next/navigation'
import { useCVStore } from '@/lib/store'
import { useT } from '@/lib/i18n/context'
import { CVData } from '@/types/cv'

// ── Types ──────────────────────────────────────────────────────────────
type Stage = 'input' | 'generating' | 'preview'

const TEMPLATE_OPTIONS = [
  { id: 'golden',     label: 'ذهبي',          labelEn: 'Golden',     color: '#C9A84C', desc: 'كلاسيكي فاخر',    descEn: 'Classic luxury' },
  { id: 'casablanca', label: 'الدار البيضاء', labelEn: 'Casablanca', color: '#10B981', desc: 'مغربي أنيق',       descEn: 'Elegant Moroccan' },
  { id: 'gulf',       label: 'خليجي',          labelEn: 'Gulf',       color: '#0F3460', desc: 'احترافي خليجي',   descEn: 'Gulf professional' },
  { id: 'minimal',    label: 'مينيمال',        labelEn: 'Minimal',    color: '#888',    desc: 'بسيط وعصري',      descEn: 'Clean & modern' },
  { id: 'tech',       label: 'تقني',           labelEn: 'Tech',       color: '#06B6D4', desc: 'للمطورين',        descEn: 'For developers' },
]

const EXAMPLES = [
  'أنا أحمد، مطور Full Stack عندي 5 سنين خبرة. شغلت في شركة OCP وStartup بالدار البيضاء. متقن React, Node.js, Python. خريج المدرسة المحمدية للمهندسين 2019.',
  'I am a Marketing Manager with 7 years experience in FMCG. Worked at Unilever Morocco and P&G Egypt. MBA from ISCAE. Expert in digital marketing, brand strategy, and team leadership.',
  'مهندسة معمارية من الرياض، خريجة جامعة الملك فهد 2020. عملت في مكتب هندسي كبير 3 سنوات. أتقن AutoCAD وRevit وSketchUp. أبحث عن فرص في الإمارات.',
  'Software engineer, 8 years in fintech. Built payment systems processing $2M daily. Tech lead at Attijariwafa Bank. Expert in Java Spring Boot, Kafka, AWS. Based in Casablanca.',
]

// ── Voice input hook ───────────────────────────────────────────────────
function useVoiceInput(onTranscript: (t: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const r = new SpeechRecognition()
      r.continuous = true
      r.interimResults = true
      r.lang = 'ar-MA' // defaults to Arabic, user can speak either

      r.onresult = (e: any) => {
        let interim = ''
        let final = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) final += t
          else interim += t
        }
        if (final) onTranscript(final)
      }
      r.onend = () => setIsListening(false)
      r.onerror = () => setIsListening(false)
      recognitionRef.current = r
    }
  }, [])

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  return { isListening, isSupported, toggle }
}

// ── CV Field Display ───────────────────────────────────────────────────
function FieldGroup({ label, arValue, enValue, onChange }: {
  label: string; arValue: string; enValue?: string; onChange?: (v: string) => void
}) {
  if (!arValue && !enValue) return null
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{label}</div>
      {onChange ? (
        <input
          value={arValue}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
          dir="rtl"
        />
      ) : (
        <div>
          {arValue && <div className="text-sm text-white" dir="rtl">{arValue}</div>}
          {enValue && arValue !== enValue && <div className="text-sm text-gray-400 mt-0.5" dir="ltr">{enValue}</div>}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────
export function GenerateClient() {
  const router = useRouter()
  const loadCV = useCVStore(s => s.loadCV)
  const { t, isRTL, locale } = useT()
  const b = t.builder

  const [stage, setStage] = useState<Stage>('input')
  const [description, setDescription] = useState('')
  const [generatedCV, setGeneratedCV] = useState<CVData | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('golden')
  const [error, setError] = useState('')
  const [generatingStep, setGeneratingStep] = useState(0)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, isSupported, toggle: toggleVoice } = useVoiceInput((transcript) => {
    setDescription(prev => prev ? prev + ' ' + transcript : transcript)
  })

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }
  }, [description])

  // Loading steps animation
  useEffect(() => {
    if (stage !== 'generating') return
    const steps = [
      'تحليل وصفك المهني…',
      'استخراج بيانات الخبرات…',
      'صياغة النبذة الشخصية…',
      'ترتيب المهارات والشهادات…',
      'اختيار أفضل قالب لك…',
      'اللمسات الأخيرة…',
    ]
    let i = 0
    const timer = setInterval(() => {
      i = (i + 1) % steps.length
      setGeneratingStep(i)
    }, 900)
    return () => clearInterval(timer)
  }, [stage])

  const STEPS_AR = [
    'تحليل وصفك المهني…',
    'استخراج بيانات الخبرات…',
    'صياغة النبذة الشخصية…',
    'ترتيب المهارات والشهادات…',
    'اختيار أفضل قالب لك…',
    'اللمسات الأخيرة…',
  ]

  const generate = async () => {
    if (!description.trim()) return
    setStage('generating')
    setError('')
    setGeneratingStep(0)

    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, lang }),
      })

      const data = await res.json()
      if (!res.ok || !data.cv) throw new Error(data.error || 'Generation failed')

      const cv = data.cv as CVData
      setGeneratedCV(cv)
      setSelectedTemplate(cv.template || 'golden')
      setStage('preview')
    } catch (e: any) {
      setError(e.message || 'GENERIC_ERROR')
      setStage('input')  // stay on input stage, modal overlays it
    }
  }

  const applyAndEdit = () => {
    if (!generatedCV) return
    // loadCV normalizes and stores the full CV including the user-selected template
    loadCV({ ...generatedCV, template: selectedTemplate as CVData['template'] })
    router.push('/builder')
  }

  const isAr = isRTL // UI language from useT
  const uiDir = isRTL ? 'rtl' : 'ltr'

  // ── STAGE: INPUT ─────────────────────────────────────────────────────
  if (stage === 'input') return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {error && (
        <AIErrorModal
          code={error}
          message={error}
          onClose={() => setError('')}
          onRetry={generate}
        />
      )}
      {/* Header */}
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-white/6">
        <a href="/" className="text-yellow-500 font-black text-xl">سيرتي.ai</a>
        <div className="flex gap-2">
          <button onClick={() => setLang('ar')} className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${lang === 'ar' ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}>🇸🇦 عربي</button>
          <button onClick={() => setLang('en')} className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${lang === 'en' ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}>🇬🇧 English</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 pt-8 sm:py-12 pb-8 max-w-2xl mx-auto w-full">

        {/* Icon + Title */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="relative inline-block mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-yellow-500/20">
              ✦
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full animate-pulse border-2 border-[#080810]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 sm:mb-3">
            {b.generateTitle}
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            {b.generateSubtitle}
          </p>
        </div>

        {/* Text area */}
        <div className="w-full relative mb-4">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={b.generatePlaceholder}
            dir={isRTL ? 'rtl' : 'ltr'}
            rows={5}
            className="w-full bg-[#111118] border border-white/10 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 text-base text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none resize-none transition-colors leading-relaxed"
            style={{ minHeight: 140 }}
          />
          {/* Voice button */}
          {isSupported && (
            <button
              onClick={toggleVoice}
              className={`absolute bottom-4 ${isRTL ? 'left-4' : 'right-4'} w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/30'
              }`}
              title={isListening ? (b.genStopRecording) : (b.genSpeakNow)}
            >
              {isListening ? '⏹' : '🎙'}
            </button>
          )}
        </div>

        {/* Voice status */}
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-red-400 mb-4">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            {b.genListening}
          </div>
        )}

        {/* Example chips */}
        <div className="w-full mb-6">
          <p className="text-xs text-gray-600 mb-2 uppercase tracking-widest">{b.voiceInput}</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setDescription(ex)}
                className="text-xs text-gray-500 hover:text-gray-300 border border-white/8 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
              >
                {ex.length > 50 ? ex.slice(0, 50) + '…' : ex}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!description.trim()}
          className="w-full py-4 sm:py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-base sm:text-lg active:scale-98 hover:from-yellow-400 hover:to-yellow-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-3"
        >
          <span>✦</span>
          {b.generateBtn}
        </button>

        <p className="text-xs text-gray-700 mt-4 text-center">
          {b.genTakes}
        </p>
      </div>
    </div>
  )

  // ── STAGE: GENERATING ────────────────────────────────────────────────
  if (stage === 'generating') return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Animated logo */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-5xl shadow-2xl shadow-yellow-500/30 animate-pulse">
            ✦
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 bg-yellow-400 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-1.5 h-1.5 bg-yellow-600 rounded-full" />
          </div>
        </div>

        <h2 className="text-2xl font-black mb-3">
          {b.generating}
        </h2>
        <p className="text-yellow-400 text-sm font-semibold mb-8 min-h-[1.5em] transition-all">
          {STEPS_AR[generatingStep]}
        </p>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-white/8 rounded-full overflow-hidden mx-auto">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-700"
            style={{ width: `${((generatingStep + 1) / STEPS_AR.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )

  // ── STAGE: PREVIEW ───────────────────────────────────────────────────
  if (stage === 'preview' && generatedCV) {
    const p = generatedCV.personal
    return (
      <div className="min-h-screen bg-[#080810] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#080810]/95 backdrop-blur border-b border-white/8 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/" className="text-yellow-500 font-black text-lg">سيرتي.ai</a>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">{b.genDone}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStage('input')}
              className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              {b.genNewDesc}
            </button>
            <button
              onClick={applyAndEdit}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              {b.genEditCV}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

          {/* ── CV Summary card ──────────────────────────────────────── */}
          <div className="bg-[#111118] rounded-2xl border border-white/8 overflow-hidden">
            {/* Gold top bar */}
            <div className="h-1 bg-gradient-to-r from-yellow-500 to-yellow-300" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-2xl font-black text-black flex-shrink-0">
                  {p.fullName ? p.fullName[0] : '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black">{p.fullName || p.fullNameEn}</h2>
                  {p.fullNameEn && p.fullName !== p.fullNameEn && (
                    <div className="text-sm text-gray-500" dir="ltr">{p.fullNameEn}</div>
                  )}
                  <div className="text-yellow-400 text-sm font-semibold mt-1">
                    {p.jobTitle || p.jobTitleEn}
                    {p.jobTitleEn && p.jobTitle && p.jobTitle !== p.jobTitleEn && (
                      <span className="text-gray-600 font-normal"> / {p.jobTitleEn}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {p.email && <span className="text-xs text-gray-500">📧 {p.email}</span>}
                    {p.phone && <span className="text-xs text-gray-500">📞 {p.phone}</span>}
                    {p.location && <span className="text-xs text-gray-500">📍 {p.location}</span>}
                  </div>
                </div>
              </div>

              {/* Summary */}
              {(p.summary || p.summaryEn) && (
                <div className="bg-white/3 rounded-xl p-4 mb-6">
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                    {b.genSummaryLabel}
                  </div>
                  {p.summary && <p className="text-sm text-gray-300 leading-relaxed mb-2" dir="rtl">{p.summary}</p>}
                  {p.summaryEn && p.summaryEn !== p.summary && (
                    <p className="text-sm text-gray-400 leading-relaxed" dir="ltr">{p.summaryEn}</p>
                  )}
                </div>
              )}

              {/* Experience */}
              {generatedCV.experience.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
                    {b.genExpLabel} ({generatedCV.experience.length})
                  </div>
                  <div className="space-y-3">
                    {generatedCV.experience.map((exp, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-bold">{exp.jobTitle || exp.jobTitleEn}</div>
                          <div className="text-xs text-yellow-400">{exp.company || exp.companyEn}</div>
                          <div className="text-xs text-gray-600">{exp.startDate}{(exp.startDate && (exp.endDate || exp.isCurrent)) ? ' — ' : ''}{exp.isCurrent ? b.present : exp.endDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills + Languages row */}
              <div className="grid grid-cols-2 gap-4">
                {generatedCV.skills.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">{b.genSkillsLabel}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedCV.skills.slice(0, 8).map((s, i) => (
                        <span key={i} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg">{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {generatedCV.languages.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">{b.genLangsLabel}</div>
                    <div className="space-y-1">
                      {generatedCV.languages.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-gray-300">{l.name}</span>
                          <span className="text-xs text-gray-600">— {l.level === 'native' ? (b.genLangsLabel === b.genLangsLabel ? (locale === 'ar' ? 'أصلية' : locale === 'fr' ? 'Natif' : 'Native') : 'Native') : l.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Template chooser ─────────────────────────────────────── */}
          <div>
            <h3 className="text-lg font-black mb-1">{b.chooseTemplate}</h3>
            <p className="text-sm text-gray-500 mb-5">
              {b.genAutoTemplate}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TEMPLATE_OPTIONS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-center group ${
                    selectedTemplate === t.id
                      ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/10'
                      : 'border-white/8 hover:border-white/20 bg-white/3'
                  }`}
                >
                  {selectedTemplate === t.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-black">✓</div>
                  )}
                  {/* Color swatch */}
                  <div className="w-8 h-8 rounded-lg mx-auto mb-2 border border-white/10" style={{ background: t.color }} />
                  <div className={`text-xs font-bold ${selectedTemplate === t.id ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {locale === 'ar' ? t.label : t.labelEn}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {locale === 'ar' ? t.desc : t.descEn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <button
              onClick={applyAndEdit}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-lg hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
            >
              {b.tailorEditCustomize}
            </button>
            <button
              onClick={() => setStage('input')}
              className="sm:w-auto py-4 px-6 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all font-semibold"
            >
              {b.genNewDesc}
            </button>
          </div>
        </div>
    </div>
  )
  }
}
