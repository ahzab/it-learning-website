// lib/stripe.ts
// Stripe integration — aligned with the new 3-tier plan model.
import Stripe from 'stripe'
import { STRIPE_PLANS } from './plans'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export async function createCheckoutSession({
  userId,
  userEmail,
  plan,
  successUrl,
  cancelUrl,
}: {
  userId:     string
  userEmail:  string
  plan:       'STARTER' | 'PRO'
  successUrl: string
  cancelUrl:  string
}) {
  const planData = STRIPE_PLANS[plan]

  const session = await stripe.checkout.sessions.create({
    mode:                 planData.mode,
    payment_method_types: ['card'],
    customer_email:       userEmail,
    line_items: [{ price: planData.priceId, quantity: 1 }],
    metadata:   { userId, plan },
    success_url: successUrl,
    cancel_url:  cancelUrl,
    // Collect billing address for invoicing (required for EU VAT)
    billing_address_collection: 'auto',
    // Allow promo codes
    allow_promotion_codes: true,
  })

  return session
}
