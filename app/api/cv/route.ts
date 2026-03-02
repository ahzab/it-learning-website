// app/api/cv/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { cvSaveSchema } from '@/lib/validation/schemas'
import { cvService } from '@/lib/services'
import { unauthorized, created, json } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const cvs = await cvService.listCVs(session.user.id)
  return json(cvs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const v = await apiValidate(req, cvSaveSchema)
  if (!v.ok) return v.response

  const cv = await cvService.createCV({ userId: session.user.id, ...v.data })
  return created(cv)
}
