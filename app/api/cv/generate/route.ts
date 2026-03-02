// app/api/cv/generate/route.ts
export const runtime = 'edge'

import { apiValidate } from '@/lib/validation/apiValidate'
import { generateSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { mapAIResult } from '@/lib/utils'

export async function POST(req: Request) {
  const v = await apiValidate(req, generateSchema)
  if (!v.ok) return v.response

  const result = await aiService.generateCV(v.data.description, v.data.lang ?? 'auto')
  return mapAIResult(result, data => ({ cv: data }))
}
