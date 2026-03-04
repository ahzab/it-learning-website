import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { aiRequestSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { track, getIP } from '@/lib/observability'
import type { AIAction } from '@/lib/ai/prompts'

export async function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  const ip   = getIP(req)
  const user = await getMobileUser(req)
  if (!user) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/mobile/ai' } })
    return unauthorized()
  }

  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = aiRequestSchema.safeParse(body)
  if (!parsed.success) return err('Invalid action or missing context', 422, 'VALIDATION_ERROR')

  const guard = await checkAIAccess(user.id, user.plan ?? 'FREE', parsed.data.action as any, ip)
  if (!guard.ok) return new Response(JSON.stringify(guard.body), { status: guard.status })

  const result = await aiService.runAIAssist(
    parsed.data.action as AIAction,
    parsed.data.context as Record<string, unknown>,
    { userId: user.id, ip },
  )
  if (!result.ok) return err(result.message, result.status, result.code)
  return ok({ result: result.data, action: parsed.data.action })
}
