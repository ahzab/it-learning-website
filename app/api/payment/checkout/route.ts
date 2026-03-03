// app/api/payment/checkout/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { checkoutSchema } from '@/lib/validation/schemas'
import { paymentService } from '@/lib/services'
import { track, getIP } from '@/lib/observability'
import { unauthorized, json, serverError } from '@/lib/utils'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/payment/checkout' } })
    return unauthorized()
  }

  const v = await apiValidate(req, checkoutSchema)
  if (!v.ok) return v.response

  const { plan } = v.data as { plan: 'STARTER' | 'PRO' }
  const baseUrl  = (process.env.NEXT_PUBLIC_APP_URL ?? '')

  try {
    const checkout = await paymentService.createCheckout(
      session.user.id,
      session.user.email!,
      plan,
      `${baseUrl}/dashboard?success=true`,
      `${baseUrl}/pricing`,
    )
    track({ name: 'payment.checkout_started', userId: session.user.id, ip,
      data: { plan, sessionId: checkout.sessionId } })
    return json({ url: checkout.url })
  } catch (e) {
    track({ name: 'payment.webhook_error', userId: session.user.id, ip, severity: 'critical',
      data: { op: 'createCheckout', plan, error: String(e) } })
    return serverError('Failed to create payment session')
  }
}
