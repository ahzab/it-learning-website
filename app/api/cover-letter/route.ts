import { getServerSession }  from 'next-auth'
import { authOptions }        from '@/lib/auth'
import { track, getIP }      from '@/lib/observability'
import { unauthorized, json } from '@/lib/utils'
import { NextResponse }       from 'next/server'
import * as clService from '@/lib/services/cover-letter.service'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()
  const list = await clService.listCoverLetters(session.user.id)
  return json(list)
}

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }
  const body = await req.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  const cl = await clService.saveCoverLetter(session.user.id, body)
  return NextResponse.json(cl, { status: 201 })
}
