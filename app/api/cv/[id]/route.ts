// app/api/cv/[id]/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { cvSaveSchema } from '@/lib/validation/schemas'
import { cvService } from '@/lib/services'
import { unauthorized, notFound, json } from '@/lib/utils/httpResponse'
import { guardId } from '@/lib/utils/idGuard'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const g = guardId(params.id)
  if (!g.ok) return g.response as ReturnType<typeof notFound>

  const cv = await cvService.getCVById(g.id, session.user.id)
  if (!cv) return notFound('CV')
  return json(cv)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const g = guardId(params.id)
  if (!g.ok) return g.response as ReturnType<typeof notFound>

  const v = await apiValidate(req, cvSaveSchema)
  if (!v.ok) return v.response

  const cv = await cvService.updateCV(g.id, session.user.id, v.data)
  if (!cv) return notFound('CV')
  return json(cv)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const g = guardId(params.id)
  if (!g.ok) return g.response as ReturnType<typeof notFound>

  const deleted = await cvService.deleteCV(g.id, session.user.id)
  if (!deleted) return notFound('CV')
  return json({ deleted: true })
}
