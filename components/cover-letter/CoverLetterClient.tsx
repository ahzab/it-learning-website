'use client'
// components/cover-letter/CoverLetterClient.tsx
// Full cover letter builder with AI generation + in-editor improvements.
// Aesthetic: premium editorial — dark parchment, letterpress typography,
// gold editorial accents, deliberate whitespace.

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useT } from '@/lib/i18n/context'
import { useCVStore } from '@/lib/store'

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage  = 'setup' | 'generating' | 'editing' | 'saved' | 'error'
type Tone   = 'professional' | 'friendly' | 'confident' | 'creative'
type Lang   = 'ar' | 'en' | 'bilingual'

interface GenerateResult {
  subject:   string
  content:   string
  contentEn: string
  preview:   string
  keyPoints: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TONES: { id: Tone; labelAr: string; labelEn: string; desc: string; emoji: string }[] = [
  { id: 'professional', labelAr: 'احترافي', labelEn: 'Professional', desc: 'رسمي ومتقن',   emoji: '🏛' },
  { id: 'confident',    labelAr: 'واثق',     labelEn: 'Confident',    desc: 'جريء ومؤثر',   emoji: '⚡' },
  { id: 'friendly',     labelAr: 'ودّي',     labelEn: 'Friendly',     desc: 'دافئ ومتحمس',  emoji: '🌿' },
  { id: 'creative',     labelAr: 'إبداعي',   labelEn: 'Creative',     desc: 'مميز ومختلف',  emoji: '✦' },
]

const IMPROVE_SUGGESTIONS = {
  ar: ['اجعله أقوى وأكثر تأثيراً', 'قصّره بـ ٢٠٪', 'اجعله أكثر تحديداً بشأن الشركة', 'أضف أرقام ومؤشرات أداء', 'اجعل الافتتاحية أكثر جذباً'],
  en: ['Make it punchier', 'Shorten by 20%', 'Be more specific about the company', 'Add metrics and KPIs', 'Rewrite the opening hook'],
}

const GENERATING_STEPS = {
  ar: ['تحليل ملفك المهني…', 'دراسة متطلبات الوظيفة…', 'صياغة المقدمة…', 'ربط خبراتك بالمتطلبات…', 'صقل الأسلوب…', 'اللمسات الأخيرة…'],
  en: ['Analyzing your profile…', 'Reviewing job requirements…', 'Crafting the opening…', 'Matching your experience…', 'Polishing the tone…', 'Final touches…'],
}

// ── Copy to clipboard helper ──────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return { copied, copy }
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CoverLetterClient() {
  const { data: session } = useSession()
  const { t, isRTL, locale } = useT()
  const cvData = useCVStore(s => s.data)

  const [stage, setStage]               = useState<Stage>('setup')
  const [jobTitle, setJobTitle]         = useState('')
  const [company, setCompany]           = useState('')
  const [jobDesc, setJobDesc]           = useState('')
  const [extraNotes, setExtraNotes]     = useState('')
  const [tone, setTone]                 = useState<Tone>('professional')
  const [lang, setLang]                 = useState<Lang>(isRTL ? 'ar' : 'en')
  const [result, setResult]             = useState<GenerateResult | null>(null)
  const [activeTab, setActiveTab]       = useState<'ar' | 'en'>('ar')
  const [contentAr, setContentAr]       = useState('')
  const [contentEn, setContentEn]       = useState('')
  const [improveInstruction, setImproveInstruction] = useState('')
  const [improving, setImproving]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saveSuccess, setSaveSuccess]   = useState(false)
  const [error, setError]               = useState('')
  const [generatingStep, setGeneratingStep] = useState(0)
  const { copied, copy }                = useCopy()

  const isAr = isRTL || locale === 'ar'

  // Populate form lang from UI locale
  useEffect(() => {
    setLang(isRTL ? 'ar' : 'en')
    setActiveTab(isRTL ? 'ar' : 'en')
  }, [isRTL])

  // Generating step animation
  useEffect(() => {
    if (stage !== 'generating') return
    let i = 0
    const steps = GENERATING_STEPS[isAr ? 'ar' : 'en']
    const t = setInterval(() => { i = (i + 1) % steps.length; setGeneratingStep(i) }, 900)
    return () => clearInterval(t)
  }, [stage, isAr])

  // ── Generate ────────────────────────────────────────────────────────────────

  const generate = async () => {
    if (!jobTitle.trim() || !company.trim()) return
    setStage('generating')
    setError('')
    setGeneratingStep(0)

    // Build CV context — use store data if available
    const cvContext = cvData?.personal?.fullName
      ? {
          name:     cvData.personal.fullName || cvData.personal.fullNameEn,
          title:    cvData.personal.jobTitle || cvData.personal.jobTitleEn,
          summary:  cvData.personal.summary  || cvData.personal.summaryEn,
          experience: cvData.experience.slice(0, 4).map(e => ({
            title:   e.jobTitle || e.jobTitleEn,
            company: e.company  || e.companyEn,
            period:  `${e.startDate} — ${e.isCurrent ? 'Present' : e.endDate}`,
            desc:    e.description || e.descriptionEn,
          })),
          skills:   cvData.skills.slice(0, 10).map(s => s.name),
          education: cvData.education.slice(0, 2).map(e => ({
            degree:      e.degree || e.degreeEn,
            institution: e.institution || e.institutionEn,
          })),
          languages: cvData.languages.map(l => ({ name: l.name, level: l.level })),
        }
      : { name: session?.user?.name || '', skills: [], experience: [], education: [] }

    try {
      const res = await fetch('/api/cover-letter/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          cv:          cvContext,
          jobTitle,
          company,
          jobDescription: jobDesc,
          extraNotes,
          tone,
          lang,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402) throw new Error('NO_CREDITS')
        if (res.status === 403) throw new Error('PLAN_REQUIRED')
        throw new Error(data.error || 'Generation failed')
      }

      setResult(data)
      setContentAr(data.content || '')
      setContentEn(data.contentEn || data.content || '')
      setActiveTab(lang === 'en' ? 'en' : 'ar')
      setStage('editing')
    } catch (e: any) {
      setError(e.message)
      setStage('error')
    }
  }

  // ── Improve ─────────────────────────────────────────────────────────────────

  const improve = async () => {
    if (!improveInstruction.trim()) return
    setImproving(true)
    const currentContent = activeTab === 'ar' ? contentAr : contentEn

    try {
      const res = await fetch('/api/cover-letter/improve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: currentContent, instruction: improveInstruction, lang: activeTab }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Improvement failed')

      if (activeTab === 'ar') setContentAr(data.improved)
      else setContentEn(data.improved)
      setImproveInstruction('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImproving(false)
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!contentAr && !contentEn) return
    setSaving(true)
    try {
      const res = await fetch('/api/cover-letter', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:     `${jobTitle} — ${company}`,
          content:   contentAr || contentEn,
          contentEn: contentEn || contentAr,
          tone, jobTitle, company,
          language:  lang === 'en' ? 'EN' : 'AR',
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const dir = isRTL ? 'rtl' : 'ltr'

  // ── STAGE: SETUP ─────────────────────────────────────────────────────────────

  if (stage === 'setup') return (
    <div className="min-h-screen bg-[#06060A] text-white" dir={dir}>

      {/* Header */}
      <header className="border-b border-white/6 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <a href="/" className="text-yellow-500 font-black text-xl tracking-tight">سيرتي.ai</a>
        <a href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors border border-white/8 px-3 py-1.5 rounded-lg">
          {isAr ? '← لوحتي' : '← Dashboard'}
        </a>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">

        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs text-yellow-500/70 uppercase tracking-[0.2em] font-bold mb-5 border border-yellow-500/15 px-4 py-2 rounded-full">
            <span>✦</span>
            {isAr ? 'مولّد خطابات التقديم بالذكاء الاصطناعي' : 'AI Cover Letter Builder'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">
            {isAr ? (
              <><span className="text-yellow-400">خطاب تقديم</span> يفتح الأبواب</>
            ) : (
              <>A cover letter that <span className="text-yellow-400">opens doors</span></>
            )}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            {isAr
              ? 'أخبرنا عن الوظيفة وسيكتب الذكاء الاصطناعي خطاباً مخصصاً لك يعكس تجربتك الحقيقية'
              : 'Tell us about the role and our AI writes a personalized letter that reflects your real experience'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">

          {/* Job + Company row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-2">
                {isAr ? 'المسمى الوظيفي *' : 'Job Title *'}
              </label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder={isAr ? 'مهندس برمجيات أول' : 'Senior Software Engineer'}
                dir={dir}
                className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-2">
                {isAr ? 'اسم الشركة *' : 'Company *'}
              </label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder={isAr ? 'Careem، Noon، OCP…' : 'Careem, Noon, OCP…'}
                dir={dir}
                className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Job description */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-2">
              {isAr ? 'وصف الوظيفة (اختياري لكن يحسّن الجودة كثيراً)' : 'Job description (optional but greatly improves quality)'}
            </label>
            <textarea
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder={isAr ? 'الصق وصف الوظيفة هنا…' : 'Paste the job description here…'}
              dir={dir}
              rows={4}
              className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Tone selector */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-3">
              {isAr ? 'أسلوب الكتابة' : 'Writing tone'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    tone === t.id
                      ? 'border-yellow-500/60 bg-yellow-500/8 text-yellow-400'
                      : 'border-white/8 hover:border-white/20 text-gray-400 hover:text-gray-200'
                  }`}>
                  <div className="text-lg mb-1">{t.emoji}</div>
                  <div className="text-xs font-bold">{isAr ? t.labelAr : t.labelEn}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-3">
              {isAr ? 'لغة الخطاب' : 'Letter language'}
            </label>
            <div className="flex gap-2">
              {([
                { id: 'ar' as Lang, flag: '🇸🇦', label: 'عربي' },
                { id: 'en' as Lang, flag: '🇬🇧', label: 'English' },
                { id: 'bilingual' as Lang, flag: '🌐', label: isAr ? 'ثنائي اللغة' : 'Bilingual' },
              ] as const).map(l => (
                <button key={l.id} onClick={() => setLang(l.id)}
                  className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    lang === l.id
                      ? 'border-yellow-500/50 bg-yellow-500/8 text-yellow-400'
                      : 'border-white/8 hover:border-white/15 text-gray-400'
                  }`}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* CV status notice */}
          {cvData?.personal?.fullName ? (
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3">
              <span className="text-emerald-400 text-lg flex-shrink-0">✓</span>
              <div>
                <div className="text-xs text-emerald-400 font-semibold">
                  {isAr ? 'سيرتك الذاتية محملة' : 'Your CV is loaded'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {isAr ? `سيستخدم الذكاء الاصطناعي بيانات ${cvData.personal.fullName}` : `AI will use ${cvData.personal.fullName}'s data`}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
              <span className="text-amber-400 text-lg flex-shrink-0">💡</span>
              <div>
                <div className="text-xs text-amber-400 font-semibold">
                  {isAr ? 'نصيحة: أنشئ سيرتك أولاً للحصول على خطاب أفضل' : 'Tip: Create your CV first for a better letter'}
                </div>
                <a href="/builder" className="text-xs text-yellow-500 hover:underline mt-0.5 block">
                  {isAr ? 'إنشاء سيرة ذاتية ←' : 'Build CV →'}
                </a>
              </div>
            </div>
          )}

          {/* Extra notes */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-2">
              {isAr ? 'ملاحظات إضافية (اختياري)' : 'Extra notes (optional)'}
            </label>
            <input
              value={extraNotes}
              onChange={e => setExtraNotes(e.target.value)}
              placeholder={isAr ? 'مثال: أُقدّم من داخل الشركة، أو أُريد التركيز على مشروع معين…' : 'e.g. internal referral, focus on specific project, relocating…'}
              dir={dir}
              className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
            />
          </div>

          {/* CTA */}
          <button
            onClick={generate}
            disabled={!jobTitle.trim() || !company.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-base active:scale-98 hover:from-yellow-400 hover:to-yellow-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-3 mt-2"
          >
            <span className="text-lg">✦</span>
            {isAr ? 'اكتب خطابي الآن' : 'Write my letter now'}
          </button>
          <p className="text-center text-xs text-gray-700">
            {isAr ? 'يستغرق ١٠–٢٠ ثانية · يستخدم ٢ رصيد ذكاء اصطناعي' : 'Takes 10–20 seconds · Uses 2 AI credits'}
          </p>
        </div>
      </div>
    </div>
  )

  // ── STAGE: GENERATING ─────────────────────────────────────────────────────────

  if (stage === 'generating') {
    const steps = GENERATING_STEPS[isAr ? 'ar' : 'en']
    return (
      <div className="min-h-screen bg-[#06060A] text-white flex items-center justify-center px-4" dir={dir}>
        <div className="text-center max-w-sm">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-4xl shadow-2xl shadow-yellow-500/30 animate-pulse">
              ✉
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-1.5 h-1.5 bg-amber-600 rounded-full" />
            </div>
          </div>
          <h2 className="text-2xl font-black mb-2">
            {isAr ? 'جارٍ كتابة خطابك…' : 'Writing your letter…'}
          </h2>
          <p className="text-yellow-400 text-sm font-semibold mb-8 min-h-[1.5em]">
            {steps[generatingStep]}
          </p>
          <div className="w-64 h-1 bg-white/8 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-700"
              style={{ width: `${((generatingStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-4">
            {isAr ? `للوظيفة: ${jobTitle} في ${company}` : `For: ${jobTitle} at ${company}`}
          </p>
        </div>
      </div>
    )
  }

  // ── STAGE: ERROR ──────────────────────────────────────────────────────────────

  if (stage === 'error') return (
    <div className="min-h-screen bg-[#06060A] text-white flex items-center justify-center px-4" dir={dir}>
      <div className="text-center max-w-sm">
        {error === 'NO_CREDITS' ? (
          <>
            <div className="text-5xl mb-4">🔋</div>
            <h2 className="text-xl font-black mb-2">{isAr ? 'نفدت الأرصدة' : 'No AI credits left'}</h2>
            <p className="text-gray-400 text-sm mb-6">
              {isAr ? 'قم بالترقية للحصول على المزيد من أرصدة الذكاء الاصطناعي' : 'Upgrade your plan to get more AI credits'}
            </p>
            <div className="flex gap-3 justify-center">
              <a href="/api/payment/checkout?plan=STARTER" className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all">
                {isAr ? 'ترقية بـ$4.99' : 'Upgrade — $4.99'}
              </a>
            </div>
          </>
        ) : error === 'PLAN_REQUIRED' ? (
          <>
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-black mb-2">{isAr ? 'هذه الميزة للمشتركين' : 'Upgrade required'}</h2>
            <p className="text-gray-400 text-sm mb-6">
              {isAr ? 'خطاب التقديم متاح في خطة Starter وما فوق' : 'Cover letters require Starter plan or above'}
            </p>
            <a href="/api/payment/checkout?plan=STARTER" className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all inline-block">
              {isAr ? 'ترقية بـ$4.99' : 'Get Starter — $4.99'}
            </a>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-black mb-2">{isAr ? 'حدث خطأ' : 'Something went wrong'}</h2>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
          </>
        )}
        <button onClick={() => setStage('setup')} className="mt-3 text-sm text-gray-400 hover:text-white border border-white/10 px-5 py-2.5 rounded-xl transition-colors">
          {isAr ? '← العودة' : '← Go back'}
        </button>
      </div>
    </div>
  )

  // ── STAGE: EDITING ────────────────────────────────────────────────────────────

  if (stage === 'editing' && result) {
    const showTabs    = lang === 'bilingual'
    const activeContent = activeTab === 'ar' ? contentAr : contentEn
    const setContent    = activeTab === 'ar' ? setContentAr : setContentEn

    return (
      <div className="min-h-screen bg-[#06060A] text-white flex flex-col" dir={dir}>

        {/* Sticky header */}
        <header className="sticky top-0 z-40 bg-[#06060A]/95 backdrop-blur border-b border-white/6 px-4 sm:px-6 py-3 flex items-center gap-3">
          <a href="/" className="text-yellow-500 font-black text-lg flex-shrink-0">سيرتي.ai</a>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-bold">
                {isAr ? 'جاهز للتحرير' : 'Ready to edit'}
              </span>
            </div>
            <span className="text-xs text-gray-600 truncate hidden sm:block">
              {jobTitle} — {company}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => copy(activeContent)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition-all flex items-center gap-1.5"
            >
              {copied ? '✓' : '⎘'} {isAr ? 'نسخ' : 'Copy'}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={`text-xs px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                saveSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-yellow-500 text-black hover:bg-yellow-400'
              }`}
            >
              {saving ? '…' : saveSuccess ? '✓ ' + (isAr ? 'محفوظ' : 'Saved') : (isAr ? 'حفظ' : 'Save')}
            </button>
            <button
              onClick={() => setStage('setup')}
              className="text-xs text-gray-500 hover:text-gray-300 border border-white/8 px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
            >
              {isAr ? 'خطاب جديد' : 'New letter'}
            </button>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

          {/* ── Left: Key points + AI improve ───────────────────────────── */}
          <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">

            {/* Key selling points */}
            <div className="bg-[#0D0D18] border border-white/8 rounded-2xl p-5">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">
                ✦ {isAr ? 'نقاطك القوية' : 'Your key selling points'}
              </div>
              <ul className="space-y-2.5">
                {result.keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="text-yellow-500 mt-0.5 flex-shrink-0">◆</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Subject line */}
            <div className="bg-[#0D0D18] border border-white/8 rounded-2xl p-5">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
                📧 {isAr ? 'سطر الموضوع' : 'Email subject'}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{result.subject}</p>
              <button
                onClick={() => copy(result.subject)}
                className="mt-3 text-xs text-gray-600 hover:text-yellow-400 transition-colors flex items-center gap-1"
              >
                ⎘ {isAr ? 'نسخ الموضوع' : 'Copy subject'}
              </button>
            </div>

            {/* AI improve panel */}
            <div className="bg-[#0D0D18] border border-yellow-500/15 rounded-2xl p-5">
              <div className="text-xs text-yellow-400/70 uppercase tracking-widest font-semibold mb-4">
                ✦ {isAr ? 'تحسين بالذكاء الاصطناعي' : 'AI improvements'}
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {IMPROVE_SUGGESTIONS[activeTab === 'ar' ? 'ar' : 'en'].map((s, i) => (
                  <button key={i} onClick={() => setImproveInstruction(s)}
                    className="text-xs text-gray-500 hover:text-gray-200 border border-white/8 hover:border-white/20 px-2.5 py-1 rounded-lg transition-all">
                    {s}
                  </button>
                ))}
              </div>

              {/* Custom instruction */}
              <div className="flex gap-2">
                <input
                  value={improveInstruction}
                  onChange={e => setImproveInstruction(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && improve()}
                  placeholder={isAr ? 'تعليمات مخصصة…' : 'Custom instructions…'}
                  dir={dir}
                  className="flex-1 bg-[#111118] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-yellow-500/40 focus:outline-none"
                />
                <button
                  onClick={improve}
                  disabled={improving || !improveInstruction.trim()}
                  className="bg-yellow-500 text-black px-3 py-2 rounded-xl text-xs font-black hover:bg-yellow-400 transition-all disabled:opacity-40"
                >
                  {improving ? '…' : '✦'}
                </button>
              </div>
              <p className="text-xs text-gray-700 mt-2">
                {isAr ? 'يستخدم ١ رصيد لكل تحسين' : '1 credit per improvement'}
              </p>
            </div>

            {/* Tone chips */}
            <div className="bg-[#0D0D18] border border-white/8 rounded-2xl p-5">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
                {isAr ? 'تغيير الأسلوب' : 'Change tone'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button key={t.id}
                    onClick={() => { setTone(t.id); setImproveInstruction(isAr ? `غيّر أسلوب الكتابة ليصبح ${t.labelAr}` : `Rewrite in a ${t.labelEn.toLowerCase()} tone`) }}
                    className={`text-xs p-2 rounded-lg border transition-all text-center ${
                      tone === t.id ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/5' : 'border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/15'
                    }`}>
                    {t.emoji} {isAr ? t.labelAr : t.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Letter editor ────────────────────────────────────── */}
          <div className="lg:col-span-2 order-1 lg:order-2">

            {/* Language tabs (bilingual only) */}
            {showTabs && (
              <div className="flex gap-1 mb-4 bg-white/3 p-1 rounded-xl w-fit">
                {[{ id: 'ar' as const, label: '🇸🇦 عربي' }, { id: 'en' as const, label: '🇬🇧 English' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${
                      activeTab === tab.id ? 'bg-white/8 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Letter preview + editor */}
            <div
              className="bg-[#0D0D18] border border-white/8 rounded-2xl overflow-hidden"
              style={{ minHeight: 500 }}
            >
              {/* Paper header */}
              <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
              <div className="p-4 sm:p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-widest">
                      {isAr ? 'خطاب تقديم' : 'Cover Letter'}
                    </div>
                    <div className="text-base font-black mt-0.5 text-white">
                      {jobTitle} · {company}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-700">{new Date().toLocaleDateString(isAr ? 'ar-MA' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className={`text-xs mt-0.5 font-semibold ${
                      tone === 'professional' ? 'text-blue-400' :
                      tone === 'confident'    ? 'text-purple-400' :
                      tone === 'friendly'     ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {TONES.find(t => t.id === tone)?.[isAr ? 'labelAr' : 'labelEn']}
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable textarea */}
              <textarea
                value={activeContent}
                onChange={e => setContent(e.target.value)}
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
                className="w-full bg-transparent px-5 sm:px-8 py-6 text-gray-200 text-sm sm:text-[15px] leading-[1.9] focus:outline-none resize-none font-serif"
                style={{
                  minHeight: 480,
                  fontFamily: activeTab === 'ar'
                    ? '"Cairo", "Segoe UI", "Noto Naskh Arabic", system-ui, sans-serif'
                    : '"Georgia", "Cambria", "Times New Roman", serif',
                }}
                placeholder={isAr ? 'خطابك سيظهر هنا…' : 'Your letter will appear here…'}
              />

              {/* Word count */}
              <div className="px-5 sm:px-8 pb-4 flex items-center justify-between">
                <span className="text-xs text-gray-700">
                  {activeContent.split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
                </span>
                <button onClick={() => copy(activeContent)} className="text-xs text-gray-600 hover:text-yellow-400 transition-colors flex items-center gap-1">
                  ⎘ {isAr ? 'نسخ الكل' : 'Copy all'}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={save}
                disabled={saving}
                className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                  saveSuccess
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/15'
                }`}
              >
                {saving ? '…' : saveSuccess ? `✓ ${isAr ? 'تم الحفظ' : 'Saved!'}` : (isAr ? '💾 حفظ الخطاب' : '💾 Save letter')}
              </button>
              <button
                onClick={() => copy(activeContent)}
                className="sm:w-auto py-3.5 px-6 rounded-xl border border-white/12 text-gray-300 hover:text-white hover:border-white/25 transition-all font-semibold text-sm flex items-center gap-2 justify-center"
              >
                {copied ? `✓ ${isAr ? 'تم النسخ' : 'Copied!'}` : `⎘ ${isAr ? 'نسخ النص' : 'Copy text'}`}
              </button>
              <button
                onClick={() => setStage('setup')}
                className="sm:w-auto py-3.5 px-4 rounded-xl border border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/15 transition-all text-sm"
              >
                {isAr ? 'خطاب جديد' : 'New'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
