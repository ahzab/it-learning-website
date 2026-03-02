// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { apiValidate } from '@/lib/validation/apiValidate'
import { registerSchema } from '@/lib/validation/schemas'
import { authService } from '@/lib/services'

export async function POST(req: Request) {
  const v = await apiValidate(req, registerSchema)
  if (!v.ok) return v.response

  const result = await authService.registerUser(v.data.name, v.data.email, v.data.password)

  if (!result.ok) {
    const status = result.code === 'EMAIL_TAKEN' ? 409 : 500
    const fields = result.code === 'EMAIL_TAKEN' ? { email: 'validation.email.taken' } : {}
    return NextResponse.json({ error: result.message, fields }, { status })
  }

  return NextResponse.json({ id: result.user.id, email: result.user.email }, { status: 201 })
}
