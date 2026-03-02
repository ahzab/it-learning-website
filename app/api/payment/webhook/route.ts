// app/api/payment/webhook/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { paymentService } from '@/lib/services'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = headers().get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const { userId, plan } = session.metadata
      await Promise.all([
        paymentService.upgradePlan(userId, plan),
        paymentService.recordPayment(
          userId,
          session.payment_intent || session.id,
          session.amount_total,
          session.currency,
          plan,
        ),
      ])
      break
    }
    case 'customer.subscription.deleted': {
      const sub      = event.data.object as any
      const customer = await stripe.customers.retrieve(sub.customer) as any
      if (customer.email) await paymentService.downgradeToFree(customer.email)
      break
    }
  }

  return NextResponse.json({ received: true })
}
