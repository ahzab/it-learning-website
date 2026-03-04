// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { redirect }         from 'next/navigation'
import { prisma }           from '@/lib/prisma'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const [cvs, user, coverLetters] = await Promise.all([
    prisma.cV.findMany({
      where:   { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select:  { id: true, title: true, template: true, language: true,
                 data: true, updatedAt: true, isPublic: true },
    }),
    prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { plan: true, name: true, email: true },
    }),
    (prisma as any).coverLetter.findMany({
      where:   { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select:  { id: true, title: true, tone: true, jobTitle: true, company: true, updatedAt: true },
    }).catch(() => []),  // graceful if table not yet migrated
  ])

  return (
    <DashboardContent
      cvs={cvs}
      plan={user?.plan}
      name={user?.name}
      email={user?.email}
      coverLetters={coverLetters}
    />
  )
}
