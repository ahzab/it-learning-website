// app/api/me/credits/route.ts
// Returns current AI credit usage for the authenticated user.
// Lightweight endpoint called by AICreditsBadge component.

import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { normalizePlan, PLAN_DEFS, getRemainingCredits } from '@/lib/plans'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { plan: true, aiCreditsUsed: true },
  })

  if (!user) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  const plan      = normalizePlan(user.plan)
  const def       = PLAN_DEFS[plan]
  const remaining = getRemainingCredits(plan, user.aiCreditsUsed)

  return new Response(JSON.stringify({
    plan,
    creditsUsed:  user.aiCreditsUsed,
    creditsLimit: def.aiCredits,
    remaining,
    isUnlimited:  def.aiCredits === -1,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
