import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { generateSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { track, getIP } from '@/lib/observability'
import { mapAIResult, unauthorized } from '@/lib/utils'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/cv/generate' } })
    return unauthorized()
  }

  const v = await apiValidate(req, generateSchema)
  if (!v.ok) return v.response

  const guard = await checkAIAccess(
    session.user.id, (session.user as any).plan ?? 'FREE', 'generate_cv', ip,
  )
  if (!guard.ok) return guardError(guard)

  const { description, lang } = v.data as { description: string; lang?: string }
  const result = await aiService.generateCV(
    description, lang ?? 'auto',
    { userId: session.user.id, ip },
  )
  return mapAIResult(result, data => ({ cv: data }))
}
