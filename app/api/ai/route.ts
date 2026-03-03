export const runtime = 'edge'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { aiRequestSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { track, getIP } from '@/lib/observability'
import type { AIAction } from '@/lib/ai/prompts'
import { unauthorized } from '@/lib/utils'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/ai' } })
    return unauthorized()
  }

  const v = await apiValidate(req, aiRequestSchema)
  if (!v.ok) {
    track({ name: 'security.invalid_payload', ip, userId: session.user.id,
      severity: 'warn', data: { route: '/api/ai' } })
    return v.response
  }
  const { action, context } = v.data as { action: string; context: Record<string, unknown> }

  const guard = await checkAIAccess(
    session.user.id, (session.user as any).plan ?? 'FREE',
    action as any, ip,
  )
  if (!guard.ok) return guardError(guard)

  const result = await aiService.streamAIAssist(
    action as AIAction,
    context,
    { userId: session.user.id, ip },
  )
  if (!result.ok) return new Response(JSON.stringify({ error: result.message }), { status: result.status })
  return result.data
}
