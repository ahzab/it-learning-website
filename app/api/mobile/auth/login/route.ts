// app/api/mobile/auth/login/route.ts
import { NextRequest } from 'next/server'
import { ok, err, corsOptions, signMobileToken } from '@/lib/mobile-auth'
import { loginSchema } from '@/lib/validation/schemas'
import { authService } from '@/lib/services'

export async function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.') || '_root'
      if (!fields[field]) fields[field] = issue.message
    }
    return err('Validation failed', 422, 'VALIDATION_ERROR', { fields })
  }

  const result = await authService.loginUser(parsed.data.email, parsed.data.password)

  if (!result.ok) {
    const status = result.code === 'INVALID_CREDENTIALS' ? 401 : 500
    return err(result.message, status, result.code)
  }

  const token = await signMobileToken({ sub: result.user.id, email: result.user.email!, plan: result.user.plan })
  return ok({ token, user: result.user })
}
