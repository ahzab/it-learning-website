import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { cvSaveSchema } from '@/lib/validation/schemas'
import { cvService } from '@/lib/services'
import { track, getIP } from '@/lib/observability'
import { unauthorized, created, json } from '@/lib/utils'
import { canCreateCV, normalizePlan } from '@/lib/plans'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip: getIP(req), data: { route: 'GET /api/cv' } })
    return unauthorized()
  }
  const cvs = await cvService.listCVs(session.user.id)
  return json(cvs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip: getIP(req), data: { route: 'POST /api/cv' } })
    return unauthorized()
  }

  // Enforce CV count limit per plan
  const plan     = normalizePlan((session.user as any).plan ?? 'FREE')
  const existing = await prisma.cV.count({ where: { userId: session.user.id } })
  if (!canCreateCV(plan, existing)) {
    track({ name: 'cv.limit_hit', userId: session.user.id, plan,
      data: { currentCount: existing } })
    return new Response(JSON.stringify({ error: 'CV_LIMIT_REACHED', plan, currentCount: existing }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  const v = await apiValidate(req, cvSaveSchema)
  if (!v.ok) return v.response

  const { title, data, template, language, country } = v.data as any
  const cv = await cvService.createCV({ userId: session.user.id, title, data, template, language, country })
  return created(cv)
}
