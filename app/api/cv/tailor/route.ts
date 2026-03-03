export const runtime = 'edge'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { tailorSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { track, getIP } from '@/lib/observability'
import { mapAIResult, unauthorized } from '@/lib/utils'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/cv/tailor' } })
    return unauthorized()
  }

  const v = await apiValidate(req, tailorSchema)
  if (!v.ok) return v.response

  const guard = await checkAIAccess(
    session.user.id, (session.user as any).plan ?? 'FREE', 'tailor_cv', ip,
  )
  if (!guard.ok) return guardError(guard)

  const { cv, jobDescription, jobTitle, company } = v.data as { cv: Record<string, unknown>; jobDescription: string; jobTitle?: string; company?: string }
  const result = await aiService.tailorCV(
    cv, jobDescription, jobTitle, company,
    { userId: session.user.id, ip },
  )
  return mapAIResult(result)
}
