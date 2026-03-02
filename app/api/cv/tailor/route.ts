// app/api/cv/tailor/route.ts
export const runtime = 'edge'

import { apiValidate } from '@/lib/validation/apiValidate'
import { tailorSchema } from '@/lib/validation/schemas'
import { aiService } from '@/lib/services'
import { mapAIResult } from '@/lib/utils'

export async function POST(req: Request) {
  const v = await apiValidate(req, tailorSchema)
  if (!v.ok) return v.response

  const result = await aiService.tailorCV(
    v.data.cv as Record<string, unknown>,
    v.data.jobDescription,
    v.data.jobTitle,
    v.data.company,
  )
  return mapAIResult(result)
}
