// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CVCardActions } from '@/components/dashboard/CVCardActions'
import { LinkedInDashboardButton } from '@/components/dashboard/LinkedInDashboardButton'

const TEMPLATE_LABELS: Record<string, { label: string; color: string }> = {
  golden:     { label: '✦ ذهبي',     color: '#C9A84C' },
  casablanca: { label: '🌿 الدار البيضاء', color: '#10B981' },
  gulf:       { label: '🏛 خليجي',   color: '#0F3460' },
  minimal:    { label: '○ مينيمال',  color: '#888' },
  tech:       { label: '⚡ تقني',    color: '#06B6D4' },
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const cvs = await prisma.cV.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, name: true, email: true },
  })

  const planLabel = user?.plan === 'FREE' ? 'مجاني' : user?.plan === 'BASIC' ? 'أساسي' : 'احترافي'
  const planCls   = user?.plan === 'FREE' ? 'bg-gray-700 text-gray-300' :
                    user?.plan === 'PRO'  ? 'bg-yellow-500 text-black'  : 'bg-blue-500/20 text-blue-300'

  return (
    <div className="min-h-screen bg-[#0A0A0F]">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-[#111118] border-b border-white/8 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <Link href="/" className="text-yellow-500 font-black text-xl flex-shrink-0">سيرتي.ai</Link>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${planCls}`}>{planLabel}</span>
          <span className="text-gray-400 text-sm truncate hidden sm:block">{user?.name || user?.email}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Page title + actions ─────────────────────────────────── */}
        <div className="mb-6 sm:mb-8">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black">سيرتي الذاتية</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {cvs.length === 0 ? 'لا توجد سير ذاتية بعد' : `${cvs.length} سيرة ذاتية محفوظة`}
              </p>
            </div>
          </div>

          {/* Action buttons — 2×2 on mobile, row on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Link
              href="/generate"
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black px-4 py-2.5 rounded-xl font-bold hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-md shadow-yellow-500/20 text-sm col-span-2 sm:col-span-1"
            >
              <span>✦</span> أنشئ بالذكاء الاصطناعي
            </Link>
            <Link
              href="/builder"
              className="flex items-center justify-center gap-1.5 border border-white/15 text-gray-300 px-4 py-2.5 rounded-xl font-semibold hover:border-white/30 hover:text-white transition-all text-sm"
            >
              + يدوي
            </Link>
            <LinkedInDashboardButton />
            <Link
              href="/intelligence"
              className="flex items-center justify-center gap-1.5 border border-purple-500/25 text-purple-400 px-4 py-2.5 rounded-xl font-bold hover:bg-purple-500/10 transition-all text-sm"
            >
              📊 ذكاء مهني
            </Link>
            <Link
              href="/tailor"
              className="flex items-center justify-center gap-1.5 border border-emerald-500/25 text-emerald-400 px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-500/10 transition-all text-sm"
            >
              🎯 خصّص لوظيفة
            </Link>
          </div>
        </div>

        {/* ── Upgrade Banner ──────────────────────────────────────── */}
        {user?.plan === 'FREE' && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/30 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-yellow-400">🔓 حمّل سيرتك بصيغة PDF</div>
              <div className="text-gray-400 text-sm mt-1">ادفع $7 مرة واحدة فقط للوصول إلى كل القوالب والتصدير</div>
            </div>
            <Link
              href="/api/payment/checkout"
              className="bg-yellow-500 text-black px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-all text-center flex-shrink-0"
            >
              ترقية الحساب
            </Link>
          </div>
        )}

        {/* ── CV Grid ─────────────────────────────────────────────── */}
        {cvs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <div className="text-5xl mb-4">✦</div>
            <h2 className="text-xl font-bold mb-2">ابدأ سيرتك الذاتية</h2>
            <p className="text-gray-400 mb-8">اختر طريقة الإنشاء المناسبة لك</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/generate" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black px-8 py-3 rounded-xl font-bold hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-lg shadow-yellow-500/20">
                <span>✦</span> أنشئ بالذكاء الاصطناعي
              </Link>
              <Link href="/builder" className="inline-flex items-center gap-2 border border-white/15 text-gray-300 px-8 py-3 rounded-xl font-semibold hover:border-white/30 hover:text-white transition-all">
                + إنشاء يدوي
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cvs.map((cv) => {
              const tpl = TEMPLATE_LABELS[cv.template] || { label: cv.template, color: '#888' }
              const cvData = cv.data as any
              const jobTitle = cvData?.personal?.jobTitle || cvData?.personal?.jobTitleEn || ''
              const cvMode = cvData?.cvMode || 'ar'
              const modeLabel = cvMode === 'bilingual' ? '🌐 ثنائي' : cvMode === 'en' ? '🇬🇧 EN' : '🇸🇦 AR'

              return (
                <div
                  key={cv.id}
                  className="bg-[#111118] border border-white/8 rounded-xl p-5 hover:border-yellow-500/30 transition-all group flex flex-col gap-3"
                >
                  {/* Template color bar */}
                  <div className="h-1 rounded-full" style={{ background: tpl.color, opacity: 0.6 }} />

                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {cv.title}
                    </div>
                    {jobTitle && (
                      <div className="text-xs text-gray-500 mt-0.5">{jobTitle}</div>
                    )}
                  </div>

                  {/* Meta badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-500" style={{ color: tpl.color }}>
                      {tpl.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-500">
                      {modeLabel}
                    </span>
                    <span className="text-xs text-gray-700 mr-auto">
                      {new Date(cv.updatedAt).toLocaleDateString('ar-MA', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={`/builder?id=${cv.id}`}
                      className="flex-1 text-center bg-yellow-500/15 text-yellow-400 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500/25 transition-colors"
                    >
                      تعديل
                    </a>
                    <a
                      href={`/intelligence?cv=${cv.id}`}
                      className="px-3 py-2 rounded-lg text-sm bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/15 transition-colors"
                      title="تحليل ذكي للسوق"
                    >
                      📊
                    </a>
                    <a
                      href={`/tailor`}
                      className="px-3 py-2 rounded-lg text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/15 transition-colors"
                      title="تخصيص لوظيفة معينة"
                    >
                      🎯
                    </a>
                    <CVCardActions cvId={cv.id} cvTitle={cv.title} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
