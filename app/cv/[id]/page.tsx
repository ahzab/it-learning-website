// app/cv/[id]/page.tsx
// Public-facing shareable CV profile page.
// Renders the actual CV template in the browser — no auth required if isPublic.
// URL: /cv/[cvId]

import { prisma }      from '@/lib/prisma'
import { notFound }    from 'next/navigation'
import { CVPreview }   from '@/components/cv/CVPreview'
import type { CVData } from '@/types/cv'
import type { Metadata } from 'next'

interface Props { params: { id: string } }

async function getPublicCV(id: string) {
  if (!id || id.length > 50) return null
  return prisma.cV.findFirst({
    where: { id, isPublic: true },
    select: {
      id: true, title: true, template: true, language: true,
      data: true, createdAt: true,
      user: { select: { name: true } },
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cv = await getPublicCV(params.id)
  if (!cv) return { title: 'Profile not found | سيرتي.ai' }

  const data    = cv.data as CVData
  const name    = data.personal?.fullName || data.personal?.fullNameEn || cv.user?.name || 'Professional'
  const title   = data.personal?.jobTitle || data.personal?.jobTitleEn || ''
  const summary = (data.personal?.summary || data.personal?.summaryEn || '').slice(0, 155)

  return {
    title:       `${name} — ${cv.title} | سيرتي.ai`,
    description: summary || `View ${name}'s professional CV`,
    openGraph: {
      title:       `${name}${title ? ` · ${title}` : ''}`,
      description: summary,
      siteName:    'سيرتي.ai',
      type:        'profile',
    },
    twitter: {
      card:  'summary',
      title: `${name} — سيرتي.ai`,
    },
  }
}

export default async function PublicCVPage({ params }: Props) {
  const cv = await getPublicCV(params.id)
  if (!cv) notFound()

  const data = cv.data as CVData

  const ownerName = data.personal?.fullName || data.personal?.fullNameEn || cv.user?.name || 'Professional'
  const jobTitle  = data.personal?.jobTitle || data.personal?.jobTitleEn || ''
  const isRTL     = data.cvMode === 'ar' || (!data.cvMode && cv.language === 'AR')

  return (
    <div className="min-h-screen bg-[#080808]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Minimal branded header */}
      <header className="border-b border-white/6 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <a
            href="/"
            className="text-sm font-black text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            سيرتي.ai
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 hidden sm:block">
              {isRTL ? 'سيرة ذاتية مشاركة' : 'Shared CV profile'}
            </span>
            <a
              href="/generate"
              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/18 transition-colors font-semibold"
            >
              {isRTL ? 'أنشئ سيرتك ←' : 'Build yours →'}
            </a>
          </div>
        </div>
      </header>

      {/* Profile hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          {data.personal?.photo && (
            <img
              src={data.personal.photo}
              alt={ownerName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-yellow-500/40 mb-4"
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{ownerName}</h1>
          {jobTitle && (
            <p className="text-base text-gray-400 mb-3">{jobTitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {data.personal?.location && (
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                📍 {data.personal.location}
              </span>
            )}
            {data.personal?.email && (
              <a
                href={`mailto:${data.personal.email}`}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                ✉ {data.personal.email}
              </a>
            )}
            {data.personal?.linkedin && (
              <a
                href={data.personal.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
              >
                🔗 LinkedIn
              </a>
            )}
            {data.personal?.website && (
              <a
                href={data.personal.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                🌐 {data.personal.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        {/* CV template render */}
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/6">
          <CVPreview data={data} />
        </div>

        {/* CTA footer */}
        <div className="mt-10 sm:mt-14 text-center py-10 border-t border-white/6">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-1">
              {isRTL ? 'صُنع بواسطة' : 'Created with'}
            </div>
            <a
              href="/"
              className="text-2xl font-black text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              سيرتي.ai
            </a>
            <p className="text-sm text-gray-500 max-w-sm">
              {isRTL
                ? 'منصة الذكاء المهني العربية — أنشئ سيرتك الذاتية بالذكاء الاصطناعي'
                : 'The Arab Career Intelligence platform. Build your CV with AI'}
            </p>
            <a
              href="/generate"
              className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold text-sm hover:from-yellow-400 hover:to-amber-300 transition-all shadow-lg shadow-yellow-500/20"
            >
              {isRTL ? '✦ أنشئ سيرتك مجاناً' : '✦ Build your CV for free'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
