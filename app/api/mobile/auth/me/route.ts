// app/api/mobile/auth/me/route.ts
import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions, signMobileToken } from '@/lib/mobile-auth'
import { authService } from '@/lib/services'

export async function OPTIONS() { return corsOptions() }

export async function GET(req: NextRequest) {
  const auth = await getMobileUser(req)
  if (!auth) return unauthorized()

  const user = await authService.getUserById(auth.id)
  if (!user) return err('User not found', 404, 'NOT_FOUND')

  // Refresh token so the client always has an up-to-date plan
  const token = await signMobileToken({ sub: user.id, email: user.email!, plan: user.plan })
  return ok({ user, token })
}
