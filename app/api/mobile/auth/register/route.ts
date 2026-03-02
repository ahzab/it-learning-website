// app/api/mobile/auth/register/route.ts
import { NextRequest } from 'next/server'
import { ok, err, corsOptions } from '@/lib/mobile-auth'
import { signMobileToken } from '@/lib/mobile-auth'
import { registerSchema } from '@/lib/validation/schemas'
import { authService } from '@/lib/services'

export async function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.') || '_root'
      if (!fields[field]) fields[field] = issue.message
    }
    return err('Validation failed', 422, 'VALIDATION_ERROR', { fields })
  }

  const result = await authService.registerUser(
    parsed.data.name,
    parsed.data.email,
    parsed.data.password,
  )

  if (!result.ok) {
    const status = result.code === 'EMAIL_TAKEN' ? 409 : 500
    return err(result.message, status, result.code)
  }

  const token = await signMobileToken({ sub: result.user.id, email: result.user.email!, plan: result.user.plan })
  return ok({ token, user: result.user }, 201)
}
