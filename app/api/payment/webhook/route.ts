import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { paymentService } from '@/lib/services'
import { track } from '@/lib/observability'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e) {
    track({ name: 'payment.webhook_error', severity: 'critical',
      data: { reason: 'invalid_signature', error: String(e) } })
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { userId, plan } = session.metadata
        await Promise.all([
          paymentService.upgradePlan(userId, plan),
          paymentService.recordPayment(
            userId, session.payment_intent || session.id,
            session.amount_total, session.currency, plan,
          ),
        ])
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object
        track({ name: 'payment.failed', userId: session.metadata?.userId,
          data: { plan: session.metadata?.plan, reason: 'session_expired' } })
        break
      }
      case 'charge.dispute.created': {
        const dispute = event.data.object
        track({ name: 'payment.webhook_error', severity: 'critical',
          data: { type: 'chargeback', chargeId: dispute.charge, amount: dispute.amount } })
        break
      }
      case 'customer.subscription.deleted': {
        const sub      = event.data.object
        const customer = await stripe.customers.retrieve(sub.customer) as any
        if (customer.email) await paymentService.downgradeToFree(customer.email)
        break
      }
    }
  } catch (e) {
    track({ name: 'payment.webhook_error', severity: 'critical',
      data: { eventType: event.type, error: String(e) } })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
