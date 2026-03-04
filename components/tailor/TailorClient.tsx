'use client'
// components/tailor/TailorClient.tsx
import { useState, useRef, useEffect } from 'react'
import { AIErrorModal } from '@/components/ui/AIErrorModal'
import { useRouter } from 'next/navigation'
import { useCVStore } from '@/lib/store'
import { useT } from '@/lib/i18n/context'
import { CVData } from '@/types/cv'

type Stage = 'input' | 'tailoring' | 'review'

interface TailorResult {
  cv: CVData
  changes: { field: string; reason: string }[]
  matchScore: number
  missingSkills: string[]
  jobKeywords: string[]
}

// ── Diff highlighter ──────────────────────────────────────────────────
function ChangeCard({ change, index }: { change: { field: string; reason: string }; index: number }) {
  const icons: Record<string, string> = {
    summary: '📝', summaryEn: '📝', experience: '💼', skills: '⚡', education: '🎓',
  }
  const key = Object.keys(icons).find(k => change.field.includes(k)) || '✦'
  const icon = icons[key] || '✦'

  return (
    <div
      className="flex items-start gap-3 p-3 bg-white/3 border border-white/8 rounded-xl"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-xs font-bold text-yellow-400 mb-0.5 font-mono">{change.field}</div>
        <div className="text-xs text-gray-400 leading-relaxed">{change.reason}</div>
      </div>
    </div>
  )
}

// ── Score Ring ────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#C9A84C' : '#EF4444'

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}%</span>
        <span className="text-xs text-gray-600">match</span>
      </div>
    </div>
  )
}

const TAILORING_STEPS = [
  'تحليل متطلبات الوظيفة…',
  'مطابقة مهاراتك مع الوصف الوظيفي…',
  'إعادة صياغة النبذة الشخصية…',
  'تحسين أوصاف الخبرات…',
  'إضافة الكلمات المفتاحية لنظام ATS…',
  'ترتيب الأولويات حسب الوظيفة…',
  'المراجعة النهائية…',
]

const JOB_EXAMPLES = [
  {
    title: 'Senior React Developer',
    company: 'Careem',
    desc: `We are looking for a Senior Frontend Engineer to join our core platform team.

Requirements:
- 5+ years of experience with React and TypeScript
- Strong knowledge of state management (Redux, Zustand)
- Experience with REST APIs and GraphQL
- Familiarity with CI/CD pipelines and Docker
- Strong communication skills in English

Nice to have:
- Experience with React Native
- Knowledge of AWS or GCP`
  },
  {
    title: 'Marketing Manager',
    company: 'OCP Group',
    desc: `نحن نبحث عن مدير تسويق ذو خبرة للانضمام إلى فريقنا.

المتطلبات:
- خبرة 6+ سنوات في التسويق الرقمي وإدارة العلامة التجارية
- إتقان اللغة العربية والفرنسية والإنجليزية
- خبرة في إدارة الفرق وتحقيق الأهداف
- معرفة بأدوات Google Analytics وMeta Ads

المهام:
- قيادة استراتيجية التسويق للمنتجات الجديدة
- إدارة ميزانية تسويقية سنوية`
  },
  {
    title: 'Financial Analyst',
    company: 'Emirates NBD',
    desc: `Emirates NBD is seeking a Financial Analyst for our Investment Banking division.

Key Requirements:
- Bachelor's in Finance, Accounting, or Economics
- 3-5 years of financial modeling experience
- CFA Level 1 preferred
- Advanced Excel and Bloomberg skills
- Experience in M&A or equity research

Responsibilities:
- Build detailed financial models
- Prepare investment memos and pitch books
- Support deal execution`
  },
]

export function TailorClient() {
  const router = useRouter()
  const cv = useCVStore(s => s.cv)
  const loadCV = useCVStore(s => s.loadCV)

  const [stage, setStage] = useState<Stage>('input')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [result, setResult] = useState<TailorResult | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const [showDiffs, setShowDiffs] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasCV = !!(cv.personal.fullName || cv.personal.fullNameEn || cv.experience.length > 0)
  const { t, isRTL, locale } = useT()
  const b = t.builder
  const isAr = isRTL // UI language from useT

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 300) + 'px' }
  }, [jobDesc])

  // Step animation during tailoring
  useEffect(() => {
    if (stage !== 'tailoring') return
    let i = 0
    const timer = setInterval(() => { i = (i + 1) % TAILORING_STEPS.length; setStep(i) }, 1000)
    return () => clearInterval(timer)
  }, [stage])

  const tailor = async () => {
    if (!jobDesc.trim()) return
    setStage('tailoring')
    setError('')

    try {
      const res = await fetch('/api/cv/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv, jobDescription: jobDesc, jobTitle, company }),
      })
      const data = await res.json()
      if (!res.ok || !data.cv) throw new Error(data.error || 'Tailoring failed')

      setResult(data as TailorResult)
      setStage('review')
    } catch (e: any) {
      setError(e.message || 'GENERIC_ERROR')
      setStage('input')
    }
  }

  const applyAndEdit = () => {
    if (!result) return
    loadCV(result.cv)
    router.push('/builder')
  }

  const loadExample = (ex: typeof JOB_EXAMPLES[0]) => {
    setJobTitle(ex.title)
    setCompany(ex.company)
    setJobDesc(ex.desc)
  }

  // ── No CV warning ─────────────────────────────────────────────────
  if (!hasCV) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📄</div>
          <h2 className="text-2xl font-black mb-3">{b.tailorNoCv}</h2>
          <p className="text-gray-400 mb-8">
            {b.tailorNoCvDesc}
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/generate" className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all">
              {b.tailorGenerateAI}
            </a>
            <a href="/builder" className="border border-white/15 text-gray-300 px-6 py-3 rounded-xl font-semibold hover:border-white/30 transition-all">
              {b.tailorManual}
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── INPUT STAGE ───────────────────────────────────────────────────
  if (stage === 'input') return (
    <>
      {error && (
        <AIErrorModal
          code={error}
          message={error}
          onClose={() => setError('')}
          onRetry={tailor}
        />
      )}
      <div className="min-h-screen bg-[#080810] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-white/6">
        <div className="flex items-center gap-3">
          <a href="/" className="text-yellow-500 font-black text-xl">سيرتي.ai</a>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span>/</span>
            <span>{b.tailorBreadcrumb}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLang('ar')} className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${lang === 'ar' ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' : 'border-white/10 text-gray-500'}`}>🇸🇦</button>
          <button onClick={() => setLang('en')} className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${lang === 'en' ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' : 'border-white/10 text-gray-500'}`}>🇬🇧</button>
          <a href="/builder" className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors">
            {b.tailorManualEdit}
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-xs text-yellow-400 font-semibold mb-5">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            {b.tailorAIPowered}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 sm:mb-3">
            {b.tailorHero}
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
            {b.tailorSubtitle}
          </p>
        </div>

        {/* Current CV preview chip */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-[#111118] rounded-xl border border-white/8">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-black text-sm flex-shrink-0">
            {cv.personal.fullName?.[0] || cv.personal.fullNameEn?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{cv.personal.fullName || cv.personal.fullNameEn || (b.tailorMyCv)}</div>
            <div className="text-xs text-gray-500 truncate">
              {cv.personal.jobTitle || cv.personal.jobTitleEn || ''}{cv.experience.length > 0 ? ` · ${cv.experience.length} ${b.tailorExperiences}` : ''}
            </div>
          </div>
          <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
            {b.tailorLoaded}
          </div>
        </div>

        {/* Job info inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
              {b.jobTitleOptional}
            </label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="Senior React Developer"
              dir="ltr"
              className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
              {b.companyOptional}
            </label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Careem, OCP, Emirates NBD..."
              dir="ltr"
              className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Job description textarea */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
            {b.tailorJobDescLabel}
            <span className="text-gray-700 font-normal mr-2">{b.tailorJobDescHint}</span>
          </label>
          <textarea
            ref={textareaRef}
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            placeholder={b.tailorPlaceholder}
            className="w-full bg-[#111118] border border-white/10 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none resize-none transition-colors leading-relaxed"
            style={{ minHeight: 180 }}
          />
        </div>

        {/* Example job postings */}
        <div className="mb-6">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">{b.tailorExamples}</p>
          <div className="flex flex-wrap gap-2">
            {JOB_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(ex)}
                className="text-xs text-gray-500 hover:text-gray-300 border border-white/8 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                {ex.title} @ {ex.company}
              </button>
            ))}
          </div>
        </div>

        {/* What AI does */}
        <div className="bg-[#111118] border border-white/6 rounded-2xl p-5 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">
            {b.tailorWhatAI}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📝', ar: 'يعيد صياغة النبذة الشخصية لتتناسب مع الوظيفة', en: 'Rewrites your summary to match the role', fr: 'Réécrit votre résumé pour correspondre au poste' },
              { icon: '💼', ar: 'يبرز الخبرات الأكثر صلة بالوظيفة', en: 'Highlights your most relevant experience', fr: 'Met en avant votre expérience la plus pertinente' },
              { icon: '🔑', ar: 'يضيف كلمات مفتاحية من الإعلان لنظام ATS', en: 'Adds ATS keywords from the job posting', fr: "Ajoute des mots-clés ATS de l'offre d'emploi" },
              { icon: '⚡', ar: 'يرتب المهارات حسب أهميتها للوظيفة', en: 'Reorders skills by job relevance', fr: 'Réorganise les compétences par pertinence' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="text-xs text-gray-400 leading-relaxed">{locale === 'ar' ? item.ar : locale === 'fr' ? item.fr : item.en}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/6 flex items-center gap-2">
            <span className="text-emerald-400 text-sm">✓</span>
            <span className="text-xs text-gray-500">
              {b.tailorNoInvention}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={tailor}
          disabled={!jobDesc.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-lg hover:from-yellow-400 hover:to-yellow-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-3"
        >
          <span>✦</span>
          {b.tailorSubmit}
        </button>
      </div>
    </div>
    </>
  )

  // ── TAILORING STAGE ───────────────────────────────────────────────
  if (stage === 'tailoring') return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        {/* Animated icon */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-5xl shadow-2xl shadow-yellow-500/30">
            ✦
          </div>
          {/* Orbiting rings */}
          <div className="absolute inset-0 rounded-3xl border-2 border-yellow-500/20 animate-ping" />
          <div className="absolute -inset-2 rounded-3xl border border-yellow-500/10 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black mb-2">{b.tailorInProgress}</h2>
        {(jobTitle || company) && (
          <p className="text-gray-500 text-sm mb-1">
            {jobTitle && <span className="text-yellow-400">{jobTitle}</span>}
            {company && <span className="text-gray-600"> @ {company}</span>}
          </p>
        )}
        <p className="text-yellow-400 text-sm font-semibold mb-8 min-h-[1.5em] transition-all">
          {TAILORING_STEPS[step]}
        </p>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {TAILORING_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-yellow-400' : i < step ? 'w-1.5 bg-yellow-600' : 'w-1.5 bg-white/10'}`} />
          ))}
        </div>

        <p className="text-xs text-gray-700">{b.tailorTakes}</p>
      </div>
    </div>
  )

  // ── ERROR STAGE ───────────────────────────────────────────────────


  // ── REVIEW STAGE ─────────────────────────────────────────────────
  if (stage === 'review' && result) {
    const tailoredP = result.cv.personal
    const matchColor = result.matchScore >= 80 ? '#10B981' : result.matchScore >= 60 ? '#C9A84C' : '#EF4444'

    return (
      <div className="min-h-screen bg-[#080810] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Sticky header */}
        <div className="sticky top-0 z-40 bg-[#080810]/95 backdrop-blur border-b border-white/8 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/" className="text-yellow-500 font-black text-lg flex-shrink-0">سيرتي.ai</a>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">{b.tailorDone}</span>
            </div>
            {(jobTitle || company) && (
              <span className="hidden md:block text-xs text-gray-500 truncate">
                {jobTitle && <span className="text-gray-300">{jobTitle}</span>}
                {company && <span> @ {company}</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setStage('input')} className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
              {b.tailorDifferentJob}
            </button>
            <button
              onClick={applyAndEdit}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              ✎ {b.tailorEditSave}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          {/* ── Match score + keywords ──────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score */}
            <div className="bg-[#111118] rounded-2xl border border-white/8 p-6 flex items-center gap-5">
              <ScoreRing score={result.matchScore} />
              <div>
                <h3 className="text-lg font-black mb-1">{b.tailorMatchScore}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {result.matchScore >= 80
                    ? (b.tailorExcellent)
                    : result.matchScore >= 60
                    ? (b.tailorGood)
                    : (b.tailorPartial)}
                </p>
                {result.missingSkills.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">{b.tailorMissingSkills}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.missingSkills.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-lg">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Keywords added */}
            <div className="bg-[#111118] rounded-2xl border border-white/8 p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                {b.tailorKeywordsAdded}
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.jobKeywords.map((kw, i) => (
                  <span key={i} className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-lg font-semibold">
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                {b.tailorKeywordsHelp}
              </p>
            </div>
          </div>

          {/* ── Tailored CV preview ─────────────────────────────────── */}
          <div className="bg-[#111118] rounded-2xl border border-white/8 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-yellow-500 to-emerald-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black">{b.tailorTailoredCv}</h3>
                {(jobTitle || company) && (
                  <div className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-gray-400">
                    {b.tailorTailoredFor}: <span className="text-yellow-400">{jobTitle || ''}</span>{company ? ` @ ${company}` : ''}
                  </div>
                )}
              </div>

              {/* Personal */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-xl font-black text-black flex-shrink-0">
                  {tailoredP.fullName?.[0] || tailoredP.fullNameEn?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-black">{tailoredP.fullName || tailoredP.fullNameEn}</div>
                  <div className="text-yellow-400 text-sm">{tailoredP.jobTitle || tailoredP.jobTitleEn}</div>
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {tailoredP.email && <span className="text-xs text-gray-500">📧 {tailoredP.email}</span>}
                    {tailoredP.phone && <span className="text-xs text-gray-500">📞 {tailoredP.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Summary comparison */}
              {(tailoredP.summary || tailoredP.summaryEn) && (
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">{b.tailorEnhancedSummary}</span>
                  </div>
                  {tailoredP.summary && <p className="text-sm text-gray-300 leading-relaxed mb-2" dir="rtl">{tailoredP.summary}</p>}
                  {tailoredP.summaryEn && tailoredP.summaryEn !== tailoredP.summary && (
                    <p className="text-sm text-gray-400 leading-relaxed" dir="ltr">{tailoredP.summaryEn}</p>
                  )}
                </div>
              )}

              {/* Experience */}
              {result.cv.experience.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">{b.tailorExperienceLabel}</div>
                  <div className="space-y-3">
                    {result.cv.experience.slice(0, 3).map((exp, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold">{exp.jobTitle || exp.jobTitleEn}</div>
                          <div className="text-xs text-yellow-400">{exp.company || exp.companyEn}</div>
                          {(exp.description || exp.descriptionEn) && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                              {exp.description || exp.descriptionEn}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {result.cv.skills.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">{b.tailorSkillsSorted}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.cv.skills.slice(0, 10).map((s, i) => (
                      <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        i < 3
                          ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Changes made ─────────────────────────────────────────── */}
          <div>
            <button
              onClick={() => setShowDiffs(!showDiffs)}
              className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              <span className="transition-transform" style={{ transform: showDiffs ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
              {`${b.tailorChangesCount} (${result.changes.length})`}
            </button>
            {showDiffs && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.changes.map((change, i) => (
                  <span key={i}><ChangeCard change={change} index={i} /></span>
                ))}
              </div>
            )}
          </div>

          {/* ── Final CTA ────────────────────────────────────────────── */}
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
              {b.tailorDifferentJob2}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
