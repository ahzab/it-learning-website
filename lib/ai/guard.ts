// lib/ai/guard.ts
// AI usage enforcement + observability.
// Every AI call is tracked: who, what op, which plan, how many credits used.
// Blocked calls trigger alarms via the observability layer.

import { prisma }  from '@/lib/prisma'
import { track }   from '@/lib/observability'
import { canUseAI, normalizePlan, type AIOperation, PLAN_DEFS } from '@/lib/plans'

export type GuardResult =
  | { ok: true;  userId: string; plan: string; creditsUsed: number }
  | { ok: false; status: number; body: Record<string, unknown> }

export async function checkAIAccess(
  userId:    string,
  rawPlan:   string,
  operation: AIOperation,
  ip?:       string,
): Promise<GuardResult> {
  const plan = normalizePlan(rawPlan)
  const def  = PLAN_DEFS[plan]

  let creditsUsed = 0
  if (def.aiCredits !== -1) {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { aiCreditsUsed: true },
    })
    creditsUsed = user?.aiCreditsUsed ?? 0
  }

  const check = canUseAI(plan, operation, creditsUsed)

  if (!check.allowed) {
    if (check.reason === 'NO_CREDITS') {
      track({
        name:     'ai.credits_exhausted',
        userId, plan, ip,
        severity: 'warn',
        data:     { operation, used: creditsUsed, limit: def.aiCredits },
      })
      return {
        ok: false, status: 402,
        body: {
          error:      'AI_CREDITS_EXHAUSTED',
          message:    'You have used all your AI credits for this plan.',
          plan, used: creditsUsed, limit: def.aiCredits,
          upgradeUrl: '/api/payment/checkout',
        },
      }
    }
    if (check.reason === 'PLAN_REQUIRED') {
      track({
        name:     'ai.plan_gate_hit',
        userId, plan, ip,
        severity: 'info',
        data:     { operation, requiredPlan: operation === 'intelligence' ? 'PRO' : 'STARTER' },
      })
      return {
        ok: false, status: 403,
        body: {
          error:        'PLAN_UPGRADE_REQUIRED',
          message:      'This feature requires a higher plan.',
          plan,
          requiredPlan: operation === 'intelligence' ? 'PRO' : 'STARTER',
          upgradeUrl:   '/api/payment/checkout',
        },
      }
    }
  }

  // Deduct credits atomically
  if (def.aiCredits !== -1 && check.creditsNeeded > 0) {
    await prisma.user.update({
      where: { id: userId },
      data:  { aiCreditsUsed: { increment: check.creditsNeeded } },
    })
    creditsUsed += check.creditsNeeded
  }

  // Track successful access
  track({
    name:  `ai.${operation}` as any,
    userId, plan, ip,
    data:  { operation, creditsUsed: check.creditsNeeded, totalUsed: creditsUsed, planLimit: def.aiCredits },
  })

  return { ok: true, userId, plan, creditsUsed }
}

export function guardError(guard: Extract<GuardResult, { ok: false }>): Response {
  return new Response(JSON.stringify(guard.body), {
    status:  guard.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
