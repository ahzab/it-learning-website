// app/api/mobile/cv/generate/route.ts
export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { generateSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'

export async function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = generateSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Validation failed'
    return err(msg, 422, 'VALIDATION_ERROR')
  }

  const result = await aiService.generateCV(parsed.data.description, parsed.data.lang ?? 'auto')
  if (!result.ok) return err(result.message, result.status, result.code)
  return ok({ cv: result.data })
}
