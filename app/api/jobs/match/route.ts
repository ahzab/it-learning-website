// app/api/jobs/match/route.ts
// AI-scores a job posting against the user's current CV.
// Costs 1 AI credit (cheap Flash call).
export const runtime = 'nodejs'

import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { checkAIAccess, guardError } from '@/lib/ai/guard'
import { unauthorized, json }        from '@/lib/utils'
import { track, getIP }             from '@/lib/observability'
import { scoreJobMatch }            from '@/lib/services/job-boards/matcher'
import type { JobMatchRequest }     from '@/types/jobs'

export async function POST(req: Request) {
  const ip      = getIP(req)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    track({ name: 'security.unauthorized', ip, data: { route: 'POST /api/jobs/match' } })
    return unauthorized()
  }

  const body: JobMatchRequest = await req.json().catch(() => null)
  if (!body?.jobData || !body?.cvData) {
    return new Response(JSON.stringify({ error: 'Missing jobData or cvData' }), { status: 400 })
  }

  // 1 credit for job match (Flash model)
  const guard = await checkAIAccess(
    session.user.id,
    (session.user as any).plan ?? 'FREE',
    'improve_summary' as any,  // cheapest — 1 credit, same as match
    ip,
  )
  if (!guard.ok) return guardError(guard)

  const result = await scoreJobMatch(body.jobData, body.cvData as any)

  track({
    name:   'ai.assist',
    userId: session.user.id,
    ip,
    data:   { op: 'job_match', score: result.score, jobId: body.jobId },
  })

  return json(result)
}
