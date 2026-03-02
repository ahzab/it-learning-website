// app/intelligence/page.tsx
// Career Intelligence Dashboard page.
// Fetches the user's most recent CV and passes it to the dashboard.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { IntelligenceClient } from '@/components/intelligence/IntelligenceClient'

export const metadata = {
  title: 'لوحة الذكاء المهني — سيرتي',
  description: 'تحليل ذكي لسوق العمل والرواتب وفجوات المهارات',
}

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: { cv?: string; lang?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  // Load specific CV if ID passed, otherwise load most recent
  let cv = null
  let cvTitle = ''

  if (searchParams.cv) {
    const record = await prisma.cV.findFirst({
      where: { id: searchParams.cv, userId: session.user.id },
    })
    if (record) {
      cv = record.data
      cvTitle = record.title
    }
  }

  if (!cv) {
    const latest = await prisma.cV.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })
    if (latest) {
      cv = latest.data
      cvTitle = latest.title
    }
  }

  const isAr = searchParams.lang !== 'en'

  return (
    <IntelligenceClient
      cvData={cv}
      cvTitle={cvTitle}
      isAr={isAr}
    />
  )
}
