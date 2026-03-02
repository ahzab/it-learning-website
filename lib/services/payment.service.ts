// lib/services/payment.service.ts
// All Stripe and plan management logic.
// Web and mobile payment routes both call this — never import stripe directly
// from a route file.

import { stripe, PLANS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

const log = logger('payment.service')

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlanId = 'BASIC' | 'PRO'

export interface CheckoutResult {
  url:       string
  sessionId: string
}

export interface PlanStatus {
  plan:               string
  canDownloadPDF:     boolean
  canUseBilingualMode:boolean
  canUseAllTemplates: boolean
  payments:           PaymentRecord[]
}

export interface PaymentRecord {
  id:        string
  amount:    number | null
  currency:  string | null
  plan:      string
  createdAt: Date
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Create a Stripe Checkout session for the given plan.
 * successUrl / cancelUrl are provided by the caller so web and mobile can
 * specify their own redirect destinations.
 */
export async function createCheckout(
  userId:     string,
  userEmail:  string,
  plan:       PlanId,
  successUrl: string,
  cancelUrl:  string,
): Promise<CheckoutResult> {
  const session = await stripe.checkout.sessions.create({
    mode:                 plan === 'PRO' ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    customer_email:       userEmail,
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    metadata:   { userId, plan },
    success_url: successUrl,
    cancel_url:  cancelUrl,
  })

  return { url: session.url!, sessionId: session.id }
}

/**
 * Upgrade a user's plan after a successful payment.
 * Called by the Stripe webhook handler.
 */
export async function upgradePlan(userId: string, plan: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { plan } })
}

/**
 * Record a completed payment in the database.
 * Called by the Stripe webhook handler alongside upgradePlan.
 */
export async function recordPayment(
  userId:          string,
  stripePaymentId: string,
  amount:          number | null,
  currency:        string | null,
  plan:            string,
): Promise<void> {
  await prisma.payment.create({
    data: { userId, stripePaymentId, amount, currency, status: 'SUCCEEDED', plan },
  })
}

/**
 * Downgrade a user to FREE when their subscription is cancelled.
 * Called by the Stripe webhook for customer.subscription.deleted.
 */
export async function downgradeToFree(email: string): Promise<void> {
  await prisma.user.update({ where: { email }, data: { plan: 'FREE' } })
}

/**
 * Return the current plan and payment history for a user.
 * Used by mobile /payment/status and can be used by web dashboard.
 */
export async function getPlanStatus(userId: string): Promise<PlanStatus | null> {
  const [user, payments] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { plan: true, createdAt: true },
    }),
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

// ── getUserEmail ──────────────────────────────────────────────────────────────

/**
 * Fetch just the email for a user — used when building Stripe sessions
 * from a mobile request where only the user ID is in the JWT.
 * Eliminates raw Prisma calls in route handlers.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { email: true },
    })
    return user?.email ?? null
  } catch (e) {
    log.error('getUserEmail', e)
    return null
  }
}
