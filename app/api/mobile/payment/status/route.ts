// app/api/mobile/payment/status/route.ts
import { NextRequest } from 'next/server'
import { getMobileUser, ok, err, unauthorized, corsOptions } from '@/lib/mobile-auth'
import { paymentService } from '@/lib/services'

export async function OPTIONS() { return corsOptions() }

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) return unauthorized()

  try {
    const status = await paymentService.getPlanStatus(user.id)
    if (!status) return err('User not found', 404, 'NOT_FOUND')
    return ok(status)
  } catch { return err('Failed to fetch plan status', 500, 'SERVER_ERROR') }
}
