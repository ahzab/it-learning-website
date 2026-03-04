import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { intelligenceSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { track, getIP } from '@/lib/observability'
import { unauthorized, mapAIResult } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/intelligence' } })
    return unauthorized()
  }

  const v = await apiValidate(req, intelligenceSchema)
  if (!v.ok) return v.response

  const guard = await checkAIAccess(
    session.user.id, (session.user as any).plan ?? 'FREE', 'intelligence', ip,
  )
  if (!guard.ok) return guardError(guard)

  const { cv } = v.data as { cv: Record<string, unknown> }
  const result = await aiService.analyseCV(
    cv,
    { userId: session.user.id, ip },
  )
  return mapAIResult(result)
}
