export const runtime = 'edge'
import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { generateSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { checkAIAccess } from '@/lib/ai/guard'
import { getIP } from '@/lib/observability'

export async function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  const ip   = getIP(req)
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = generateSchema.safeParse(body)
  if (!parsed.success) return err('Invalid request body', 422, 'VALIDATION_ERROR')

  const guard = await checkAIAccess(user.id, user.plan ?? 'FREE', 'generate_cv', ip)
  if (!guard.ok) return new Response(JSON.stringify(guard.body), { status: guard.status })

  const result = await aiService.generateCV(
    parsed.data.description, parsed.data.lang ?? 'auto',
    { userId: user.id, ip },
  )
  if (!result.ok) return err(result.message, result.status, result.code)
  return ok({ cv: result.data })
}
