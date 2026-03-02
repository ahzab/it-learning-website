// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS = {
  BASIC: {
    name: 'أساسي',
    price: 700, // $7 in cents
    priceId: process.env.STRIPE_PRICE_BASIC!,
    features: ['تحميل PDF', 'جميع القوالب', 'تحرير غير محدود'],
  },
  PRO: {
    name: 'احترافي',
    price: 1500, // $15 in cents
    priceId: process.env.STRIPE_PRICE_PRO!,
    features: ['كل مميزات الأساسي', 'مساعد AI', 'سير ذاتية غير محدودة'],
  },
}

export async function createCheckoutSession({
  userId,
  userEmail,
  plan,
  successUrl,
  cancelUrl,
}: {
  userId: string
  userEmail: string
  plan: 'BASIC' | 'PRO'
  successUrl: string
  cancelUrl: string
}) {
  const planData = PLANS[plan]

  const session = await stripe.checkout.sessions.create({
    mode: plan === 'PRO' ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [
      {
        price: planData.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      plan,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session
}
