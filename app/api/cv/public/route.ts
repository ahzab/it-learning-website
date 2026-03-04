// app/api/cv/public/route.ts
// Toggle a CV's public visibility. POST with { cvId, isPublic: boolean }
// Returns the public URL when making public.
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { track, getIP }     from '@/lib/observability'
import { unauthorized, json, notFound, badRequest } from '@/lib/utils'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }

  const body = await req.json().catch(() => null)
  if (!body?.cvId || typeof body?.isPublic !== 'boolean') {
    return badRequest('cvId and isPublic required')
  }

  // Verify ownership
  const cv = await prisma.cV.findFirst({
    where: { id: body.cvId, userId: session.user.id },
  })
  if (!cv) return notFound('CV')

  const updated = await prisma.cV.update({
    where: { id: body.cvId },
    data:  { isPublic: body.isPublic },
    select: { id: true, isPublic: true, title: true },
  })

  const baseUrl   = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const publicUrl = body.isPublic ? `${baseUrl}/cv/${updated.id}` : null

  track({ name: 'cv.updated', userId: session.user.id, ip,
    data: { action: body.isPublic ? 'made_public' : 'made_private', cvId: body.cvId } })

  return json({ ...updated, publicUrl })
}
