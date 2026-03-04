// app/api/me/password/route.ts
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { track, getIP }     from '@/lib/observability'
import { unauthorized, json, badRequest, forbidden } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }

  const body = await req.json().catch(() => null)
  if (!body?.currentPassword || !body?.newPassword) {
    return badRequest('currentPassword and newPassword required')
  }

  const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string }

  if (newPassword.length < 8) return badRequest('New password must be at least 8 characters')
  if (newPassword.length > 128) return badRequest('Password too long')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, password: true, email: true },
  })
  if (!user) return unauthorized()

  // Google-only users have no password
  if (!user.password) {
    return forbidden('Your account uses Google sign-in. Password change is not available.')
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    track({ name: 'auth.login_failed', userId: session.user.id, ip,
      data: { reason: 'wrong_current_password_on_change' } })
    return badRequest('Current password is incorrect')
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data:  { password: hashed },
  })

  track({ name: 'auth.login', userId: session.user.id, ip,
    data: { action: 'password_changed' } })

  return json({ ok: true })
}
