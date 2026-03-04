'use client'
// components/dashboard/DashboardContent.tsx — Client wrapper for i18n
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { CVCardActions } from './CVCardActions'
import { LinkedInDashboardButton } from './LinkedInDashboardButton'

const TEMPLATE_LABELS: Record<string, { label: string; color: string }> = {
  golden:     { label: '✦ Golden',         color: '#C9A84C' },
  casablanca: { label: '🌿 Casablanca',    color: '#10B981' },
  gulf:       { label: '🏛 Gulf',          color: '#0F3460' },
  minimal:    { label: '○ Minimal',        color: '#888' },
  tech:       { label: '⚡ Tech',          color: '#06B6D4' },
}

interface CV {
  id:       string
  title:    string
  template: string
  data:     unknown
  updatedAt: Date
  isPublic: boolean
}

interface CoverLetterSummary {
  id:        string
  title:     string
  tone:      string
  jobTitle:  string | null
  company:   string | null
  updatedAt: Date
}

interface Props {
  cvs:          CV[]
  plan:         string | null | undefined
  name:         string | null | undefined
  email:        string | null | undefined
  coverLetters?: CoverLetterSummary[]
}

export function DashboardContent({ cvs, plan, name, email, coverLetters = [] }: Props) {
  const { t, isRTL } = useT()
  const b = t.builder

  const normalizedPlan = plan === 'BASIC' ? 'STARTER' : plan  // backwards compat
  const planLabel = normalizedPlan === 'FREE' ? b.planFree :
                    normalizedPlan === 'STARTER' ? b.planStarter :
                    normalizedPlan === 'PRO' ? b.planPro : b.planFree
  const planCls   = normalizedPlan === 'FREE'    ? 'bg-gray-700/60 text-gray-400' :
                    normalizedPlan === 'STARTER'  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/25' :
                    normalizedPlan === 'PRO'      ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-black' :
                    'bg-gray-700/60 text-gray-400'

  const locale = isRTL ? 'ar-MA' : 'fr-FR'

  return (
    <div className="min-h-screen bg-[#0A0A0F]">

      {/* Header */}
      <div className="bg-[#111118] border-b border-white/8 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <Link href="/" className="text-yellow-500 font-black text-xl flex-shrink-0">سيرتي.ai</Link>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${planCls}`}>{planLabel}</span>
          <span className="text-gray-400 text-sm truncate hidden sm:block">{name || email}</span>
          <Link href="/account" className="text-xs text-gray-500 hover:text-gray-300 border border-white/8 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0" title={isRTL ? 'إعدادات الحساب' : 'Account settings'}>
            ⚙
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Title + actions */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black">{b.dashboardTitle}</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {cvs.length === 0 ? b.noCVs : `${cvs.length} ${isRTL ? 'سيرة ذاتية محفوظة' : `CV${cvs.length !== 1 ? 's' : ''}`}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Link href="/generate"
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black px-4 py-2.5 rounded-xl font-bold hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-md shadow-yellow-500/20 text-sm col-span-2 sm:col-span-1">
              <span>✦</span> {b.createWithAI}
            </Link>
            <Link href="/builder"
              className="flex items-center justify-center gap-1.5 border border-white/15 text-gray-300 px-4 py-2.5 rounded-xl font-semibold hover:border-white/30 hover:text-white transition-all text-sm">
              {b.createNew}
            </Link>
            <LinkedInDashboardButton />
            <Link href="/intelligence"
              className="flex items-center justify-center gap-1.5 border border-purple-500/25 text-purple-400 px-4 py-2.5 rounded-xl font-bold hover:bg-purple-500/10 transition-all text-sm">
              {b.careerIntel}
            </Link>
            <Link href="/tailor"
              className="flex items-center justify-center gap-1.5 border border-emerald-500/25 text-emerald-400 px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-500/10 transition-all text-sm">
              {b.tailorCv}
            </Link>
            <Link href="/cover-letter"
              className="flex items-center justify-center gap-1.5 border border-amber-500/25 text-amber-400 px-4 py-2.5 rounded-xl font-bold hover:bg-amber-500/10 transition-all text-sm">
              {b.coverLetterBtn ?? '✉ Cover Letter'}
            </Link>
            <Link href="/jobs"
              className="flex items-center justify-center gap-1.5 border border-cyan-500/25 text-cyan-400 px-4 py-2.5 rounded-xl font-bold hover:bg-cyan-500/10 transition-all text-sm">
              {(b as any).jobsNav ?? '💼 Jobs'}
            </Link>
          </div>
        </div>

        {/* Upgrade Banners — context-aware */}
        {(normalizedPlan === 'FREE' || normalizedPlan === 'STARTER') && (
          <div className={`rounded-xl p-4 sm:p-5 mb-5 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            normalizedPlan === 'FREE'
              ? 'bg-gradient-to-r from-amber-500/8 to-amber-500/3 border-amber-500/20'
              : 'bg-gradient-to-r from-purple-500/8 to-purple-500/3 border-purple-500/20'
          }`}>
            <div>
              <div className={`font-bold text-sm sm:text-base ${normalizedPlan === 'FREE' ? 'text-amber-400' : 'text-purple-400'}`}>
                {normalizedPlan === 'FREE' ? b.upgradeBannerTitle : b.upgradeProBannerTitle}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm mt-1">
                {normalizedPlan === 'FREE' ? b.upgradeBannerDesc : b.upgradeProBannerDesc}
              </div>
            </div>
            <Link href={normalizedPlan === 'FREE'
                ? '/api/payment/checkout?plan=STARTER'
                : '/api/payment/checkout?plan=PRO'}
              className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all text-center flex-shrink-0 ${
                normalizedPlan === 'FREE'
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}>
              {normalizedPlan === 'FREE' ? b.upgradeBannerCta : b.upgradeProBannerCta}
            </Link>
          </div>
        )}

        {/* CV Grid */}
        {cvs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <div className="text-5xl mb-4">✦</div>
            <h2 className="text-xl font-bold mb-2">{isRTL ? 'ابدأ سيرتك الذاتية' : 'Start your CV'}</h2>
            <p className="text-gray-400 mb-8">{isRTL ? 'اختر طريقة الإنشاء المناسبة لك' : 'Choose how you want to create it'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/generate" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black px-8 py-3 rounded-xl font-bold hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-lg shadow-yellow-500/20">
                <span>✦</span> {b.createWithAI}
              </Link>
              <Link href="/builder" className="inline-flex items-center gap-2 border border-white/15 text-gray-300 px-8 py-3 rounded-xl font-semibold hover:border-white/30 hover:text-white transition-all">
                {b.createNew}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cvs.map((cv) => {
              const tpl     = TEMPLATE_LABELS[cv.template] || { label: cv.template, color: '#888' }
              const cvData  = cv.data as any
              const jobTitle = cvData?.personal?.jobTitle || cvData?.personal?.jobTitleEn || ''
              const cvMode  = cvData?.cvMode || 'ar'
              const modeLabel = cvMode === 'bilingual' ? '🌐 Bi' : cvMode === 'en' ? '🇬🇧 EN' : '🇸🇦 AR'

              return (
                <div key={cv.id}
                  className="bg-[#111118] border border-white/8 rounded-xl p-4 sm:p-5 hover:border-yellow-500/30 active:border-yellow-500/20 transition-all group flex flex-col gap-3">
                  <div className="h-1 rounded-full" style={{ background: tpl.color, opacity: 0.6 }} />
                  <div className="flex-1">
                    <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">{cv.title}</div>
                    {jobTitle && <div className="text-xs text-gray-500 mt-0.5">{jobTitle}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/5" style={{ color: tpl.color }}>{tpl.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-500">{modeLabel}</span>
                    {cv.isPublic && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        🔗 {isRTL ? 'مشارك' : 'Public'}
                      </span>
                    )}
                    <span className="text-xs text-gray-700 ms-auto">
                      {new Date(cv.updatedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/builder?id=${cv.id}`}
                      className="flex-1 text-center bg-yellow-500/15 text-yellow-400 py-2.5 rounded-lg text-sm font-bold hover:bg-yellow-500/25 active:bg-yellow-500/30 transition-colors">
                      {b.editBtn}
                    </a>
                    <a href={`/intelligence?cv=${cv.id}`}
                      className="px-3 py-2.5 rounded-lg text-sm bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/15 transition-colors" title={b.careerIntel}>
                      📊
                    </a>
                    <a href="/tailor"
                      className="px-3 py-2.5 rounded-lg text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/15 transition-colors" title={b.tailorCv}>
                      🎯
                    </a>
                    <a href="/cover-letter"
                      className="px-3 py-2.5 rounded-lg text-sm bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/15 transition-colors" title={b.coverLetterTitle ?? 'Cover Letter'}>
                      ✉
                    </a>
                    <CVCardActions cvId={cv.id} cvTitle={cv.title} isPublic={cv.isPublic} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Cover Letters Section ────────────────────────────── */}
        {coverLetters.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-white">
                ✉ {isRTL ? 'خطابات التقديم المحفوظة' : 'Saved Cover Letters'}
              </h2>
              <Link href="/cover-letter"
                className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-colors">
                + {isRTL ? 'خطاب جديد' : 'New letter'}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {coverLetters.map(cl => {
                const toneColor = cl.tone === 'professional' ? '#60A5FA'
                  : cl.tone === 'confident' ? '#A78BFA'
                  : cl.tone === 'friendly'  ? '#34D399'
                  : '#C9A84C'
                const toneEmoji = cl.tone === 'professional' ? '🏛'
                  : cl.tone === 'confident' ? '⚡'
                  : cl.tone === 'friendly'  ? '🌿' : '✦'
                return (
                  <div key={cl.id} className="bg-[#111118] rounded-xl border border-white/8 p-4 hover:border-amber-500/20 transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{cl.title}</div>
                        {cl.company && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{cl.company}</div>
                        )}
                      </div>
                      <span className="text-base flex-shrink-0">{toneEmoji}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 font-medium" style={{ color: toneColor }}>
                        {cl.tone}
                      </span>
                      {cl.jobTitle && (
                        <span className="text-xs text-gray-600 truncate">{cl.jobTitle}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">
                        {new Date(cl.updatedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                      </span>
                      <a href={`/cover-letter?id=${cl.id}`}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors opacity-0 group-hover:opacity-100">
                        {isRTL ? 'فتح ←' : 'Open →'}
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
