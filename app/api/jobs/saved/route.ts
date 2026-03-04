// app/api/jobs/saved/route.ts
// Saved jobs stored in DB (JobSave table).
// GET  — list user's saved jobs
// POST — save a job (idempotent)
// DELETE — unsave a job
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { unauthorized, json } from '@/lib/utils'
import { prisma }           from '@/lib/prisma'
import { track, getIP }     from '@/lib/observability'
import { NextResponse }     from 'next/server'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const saved = await (prisma as any).jobSave.findMany({
    where:   { userId: session.user.id },
    orderBy: { savedAt: 'desc' },
  }).catch(() => [])

  return json(saved)
}

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }

  const body = await req.json().catch(() => null)
  if (!body?.jobId || !body?.jobData) {
    return new Response(JSON.stringify({ error: 'Missing jobId or jobData' }), { status: 400 })
  }

  // Upsert — saving same job twice is idempotent
  const saved = await (prisma as any).jobSave.upsert({
    where:  { userId_jobId: { userId: session.user.id, jobId: body.jobId } },
    update: { jobData: JSON.stringify(body.jobData), savedAt: new Date() },
    create: {
      userId:   session.user.id,
      jobId:    body.jobId,
      jobData:  JSON.stringify(body.jobData),
      source:   body.jobData.source || 'unknown',
      title:    body.jobData.title  || '',
      company:  body.jobData.company || '',
      country:  body.jobData.country || '',
    },
  }).catch(() => null)

  return NextResponse.json(saved, { status: 201 })
}

export async function DELETE(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }

  const { jobId } = await req.json().catch(() => ({}))
  if (!jobId) return new Response(JSON.stringify({ error: 'Missing jobId' }), { status: 400 })

  await (prisma as any).jobSave.deleteMany({
    where: { userId: session.user.id, jobId },
  }).catch(() => null)

  return json({ deleted: true })
}
