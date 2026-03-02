// app/api/ai/route.ts
// Streaming AI assist endpoint for the web builder.
export const runtime = 'edge'

import { apiValidate } from '@/lib/validation/apiValidate'
import { aiRequestSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import type { AIAction } from '@/lib/ai/prompts'

export async function POST(req: Request) {
  const v = await apiValidate(req, aiRequestSchema)
  if (!v.ok) return v.response

  const result = await aiService.streamAIAssist(
    v.data.action as AIAction,
    v.data.context as Record<string, unknown>,
  )

  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.message }), { status: result.status })
  }

  return result.data
}
