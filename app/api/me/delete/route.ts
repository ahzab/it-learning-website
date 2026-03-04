// app/api/me/delete/route.ts
// Permanently deletes a user account and all associated data.
// Requires password confirmation (or email confirmation for OAuth users).
// Cascade deletes handle CVs, payments, cover letters, job saves via Prisma.
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { track, getIP }     from '@/lib/observability'
import { unauthorized, json, badRequest, forbidden } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function DELETE(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }

  const body = await req.json().catch(() => null)

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, password: true, email: true, name: true, plan: true },
  })
  if (!user) return unauthorized()

  // Require password confirmation for credential users
  if (user.password) {
    if (!body?.password) return badRequest('Password confirmation required')
    const valid = await bcrypt.compare(body.password, user.password)
    if (!valid) {
      track({ name: 'security.unauthorized', userId: session.user.id, ip,
        data: { reason: 'wrong_password_on_account_delete' } })
      return forbidden('Password is incorrect')
    }
  } else {
    // OAuth users: require typing their email as confirmation
    if (body?.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return badRequest('Email confirmation does not match')
    }
  }

  // Delete all user data — cascade handles relations
  await prisma.user.delete({ where: { id: session.user.id } })

  track({ name: 'auth.login', ip, severity: 'warn',
    data: { action: 'account_deleted', userId: session.user.id, plan: user.plan } })

  return json({ ok: true, message: 'Account deleted' })
}
