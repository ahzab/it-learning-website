// app/api/me/profile/route.ts
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { track, getIP }     from '@/lib/observability'
import { unauthorized, json, badRequest } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, name: true, email: true, plan: true, image: true,
              aiCreditsUsed: true, createdAt: true, stripeCustomerId: true },
  })
  if (!user) return unauthorized()

  const payments = await prisma.payment.findMany({
    where:   { userId: session.user.id, status: 'SUCCEEDED' },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, amount: true, currency: true, plan: true, createdAt: true },
    take:    10,
  })

  const cvCount = await prisma.cV.count({ where: { userId: session.user.id } })

  return json({ ...user, payments, cvCount })
}

export async function PATCH(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }

  const body = await req.json().catch(() => null)
  if (!body) return badRequest('Invalid JSON')

  const { name } = body
  if (typeof name !== 'string' || name.trim().length < 1) {
    return badRequest('Name is required')
  }
  if (name.trim().length > 100) return badRequest('Name too long')

  const updated = await prisma.user.update({
    where:  { id: session.user.id },
    data:   { name: name.trim() },
    select: { id: true, name: true, email: true, plan: true },
  })

  return json(updated)
}
