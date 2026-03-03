// lib/services/payment.service.ts
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { track } from '@/lib/observability'
import { STRIPE_PLANS } from '@/lib/plans'

const log = logger('payment.service')

export type PlanId = 'STARTER' | 'PRO'

export interface CheckoutResult  { url: string; sessionId: string }
export interface PaymentRecord   { id: string; amount: number | null; currency: string | null; plan: string; createdAt: Date }
export interface PlanStatus {
  plan: string; canDownloadPDF: boolean; canUseBilingualMode: boolean
  canUseAllTemplates: boolean; payments: PaymentRecord[]
}

export async function createCheckout(
  userId: string, userEmail: string, plan: PlanId,
  successUrl: string, cancelUrl: string,
): Promise<CheckoutResult> {
  const planData = STRIPE_PLANS[plan]
  const session  = await stripe.checkout.sessions.create({
    mode:                 planData.mode,
    payment_method_types: ['card'],
    customer_email:       userEmail,
    line_items:           [{ price: planData.priceId, quantity: 1 }],
    metadata:             { userId, plan },
    success_url:          successUrl,
    cancel_url:           cancelUrl,
    allow_promotion_codes: true,
  })
  track({ name: 'payment.checkout_started', userId,
    data: { plan, sessionId: session.id } })
  return { url: session.url!, sessionId: session.id }
}

export async function upgradePlan(userId: string, plan: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { plan } })
  track({ name: 'payment.succeeded', userId, plan,
    data: { action: 'plan_upgraded', newPlan: plan } })
}

export async function recordPayment(
  userId: string, stripePaymentId: string,
  amount: number | null, currency: string | null, plan: string,
): Promise<void> {
  await prisma.payment.create({
    data: { userId, stripePaymentId, amount, currency, status: 'SUCCEEDED', plan },
  })
}

export async function downgradeToFree(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  await prisma.user.update({ where: { email }, data: { plan: 'FREE' } })
  track({ name: 'payment.refunded', userId: user?.id,
    data: { reason: 'subscription_cancelled', email } })
}

export async function getPlanStatus(userId: string): Promise<PlanStatus | null> {
  const [user, payments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, createdAt: true } }),
    prisma.payment.findMany({
      where:   { userId, status: 'SUCCEEDED' },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, amount: true, currency: true, plan: true, createdAt: true },
    }),
  ])
  if (!user) return null
  return {
    plan:                user.plan,
    canDownloadPDF:      user.plan !== 'FREE',
    canUseBilingualMode: true,
    canUseAllTemplates:  user.plan !== 'FREE',
    payments,
  }
}

export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    return user?.email ?? null
  } catch (e) {
    log.error('getUserEmail', e)
    track({ name: 'system.db_error', severity: 'critical',
      data: { op: 'getUserEmail', userId, error: String(e) } })
    return null
  }
}
