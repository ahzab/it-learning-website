// app/api/mobile/cv/route.ts
import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { cvSaveSchema } from '@/lib/validation/schemas'
import { cvService } from '@/lib/services'

export async function OPTIONS() { return corsOptions() }

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  try {
    const cvs = await cvService.listCVs(user.id)
    return ok({ cvs, total: cvs.length })
  } catch { return err('Failed to fetch CVs', 500, 'SERVER_ERROR') }
}

export async function POST(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = cvSaveSchema.safeParse(body)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.') || '_root'
      if (!fields[field]) fields[field] = issue.message
    }
    return err('Validation failed', 422, 'VALIDATION_ERROR', { fields })
  }

  try {
    const cv = await cvService.createCV({ userId: user.id, ...parsed.data })
    return ok({ cv }, 201)
  } catch { return err('Failed to create CV', 500, 'SERVER_ERROR') }
}
