import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { track, getIP }             from '@/lib/observability'
import { unauthorized }             from '@/lib/utils'
import * as clService from '@/lib/services/cover-letter.service'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/cover-letter/generate' } })
    return unauthorized()
  }

  const body = await req.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  console.log(session.user);
  const guard = await checkAIAccess(
    session.user.id, (session.user as any).plan ?? 'FREE',
    'generate_cover_letter' as any, ip,
  )
  if (!guard.ok) return guardError(guard)

  const result = await clService.generateCoverLetter(
    body, { userId: session.user.id, ip }
  )
  if (!result.ok) return new Response(JSON.stringify({ error: result.message }), { status: result.status })
  return new Response(JSON.stringify(result.data), { headers: { 'Content-Type': 'application/json' } })
}
