// app/api/mobile/payment/route.ts
import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { checkoutSchema } from '@/lib/validation/schemas'
import { paymentService } from '@/lib/services'
import { prisma } from '@/lib/prisma'

export async function OPTIONS() { return corsOptions() }

export async function POST(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  let body: unknown
  try { body = await req.json() } catch { return err('Invalid JSON body', 400, 'INVALID_JSON') }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) return err('plan must be BASIC or PRO', 400, 'INVALID_PLAN')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } })
  if (!dbUser?.email) return err('User not found', 404, 'NOT_FOUND')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seerti.ai'

  try {
    const checkout = await paymentService.createCheckout(
      user.id,
      dbUser.email,
      parsed.data.plan,
      `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&source=mobile`,
      `${baseUrl}/payment/cancel?source=mobile`,
    )
    return ok({ url: checkout.url, sessionId: checkout.sessionId })
  } catch { return err('Failed to create payment session', 500, 'SERVER_ERROR') }
}
