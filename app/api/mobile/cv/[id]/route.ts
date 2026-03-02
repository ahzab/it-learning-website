// app/api/mobile/cv/[id]/route.ts
import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { cvSaveSchema } from '@/lib/validation/schemas'
import { cvService } from '@/lib/services'

export async function OPTIONS() { return corsOptions() }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  const cv = await cvService.getCVById(params.id, user.id)
  if (!cv) return err('CV not found', 404, 'NOT_FOUND')
  return ok({ cv })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

  const cv = await cvService.updateCV(params.id, user.id, parsed.data)
  if (!cv) return err('CV not found', 404, 'NOT_FOUND')
  return ok({ cv })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return PUT(req, { params })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  const deleted = await cvService.deleteCV(params.id, user.id)
  if (!deleted) return err('CV not found', 404, 'NOT_FOUND')
  return ok({ deleted: true })
}
