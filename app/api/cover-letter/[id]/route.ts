import { getServerSession }         from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { track, getIP }             from '@/lib/observability'
import { unauthorized, notFound, json } from '@/lib/utils'
import * as clService from '@/lib/services/cover-letter.service'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()
  const cl = await clService.getCoverLetterById(params.id, session.user.id)
  if (!cl) return notFound('Cover letter')
  return json(cl)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()
  const body = await req.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  const cl = await clService.updateCoverLetter(params.id, session.user.id, body)
  if (!cl) return notFound('Cover letter')
  return json(cl)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }
  const ok = await clService.deleteCoverLetter(params.id, session.user.id)
  if (!ok) return notFound('Cover letter')
  return json({ deleted: true })
}
