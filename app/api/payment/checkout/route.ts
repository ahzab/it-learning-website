// app/api/payment/checkout/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiValidate } from '@/lib/validation/apiValidate'
import { checkoutSchema } from '@/lib/validation/schemas'
import { paymentService } from '@/lib/services'
import { unauthorized, json, serverError } from '@/lib/utils'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const v = await apiValidate(req, checkoutSchema)
  if (!v.ok) return v.response

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  try {
    const checkout = await paymentService.createCheckout(
      session.user.id,
      session.user.email!,
      v.data.plan,
      `${baseUrl}/dashboard?success=true`,
      `${baseUrl}/pricing`,
    )
    return json({ url: checkout.url })
  } catch {
    return serverError('Failed to create payment session')
  }
}
