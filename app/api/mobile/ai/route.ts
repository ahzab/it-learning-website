// app/api/mobile/ai/route.ts
// Mobile AI endpoint — returns plain JSON (not SSE streaming).
export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { aiRequestSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import type { AIAction } from '@/lib/ai/prompts'

export async function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = aiRequestSchema.safeParse(body)
  if (!parsed.success) return err('Invalid action or missing context', 422, 'VALIDATION_ERROR')

  const result = await aiService.runAIAssist(
    parsed.data.action as AIAction,
    parsed.data.context as Record<string, unknown>,
  )

  if (!result.ok) return err(result.message, result.status, result.code)
  return ok({ result: result.data, action: parsed.data.action })
}
