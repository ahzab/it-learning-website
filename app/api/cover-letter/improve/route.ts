import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { track, getIP }             from '@/lib/observability'
import { unauthorized }             from '@/lib/utils'
import * as clService from '@/lib/services/cover-letter.service'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) { track({ name: 'security.unauthorized', ip }); return unauthorized() }

  const { content, instruction, lang } = await req.json().catch(() => ({}))
  if (!content || !instruction) return new Response(JSON.stringify({ error: 'Missing content or instruction' }), { status: 400 })

  const guard = await checkAIAccess(
    session.user.id, (session.user as any).plan ?? 'FREE',
    'improve_cover_letter' as any, ip,
  )
  if (!guard.ok) return guardError(guard)

  const result = await clService.improveCoverLetter(content, instruction, lang ?? 'ar', { userId: session.user.id, ip })
  if (!result.ok) return new Response(JSON.stringify({ error: result.message }), { status: result.status })
  return new Response(JSON.stringify({ improved: result.data }), { headers: { 'Content-Type': 'application/json' } })
}
