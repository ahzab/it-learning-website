// app/api/jobs/search/route.ts
import { getServerSession }   from 'next-auth'
import { authOptions }        from '@/lib/auth'
import { json }               from '@/lib/utils'
import { searchJobs }         from '@/lib/services/job-boards/fetcher'
import { track, getIP }       from '@/lib/observability'
import type { JobSearchParams } from '@/types/jobs'

export const runtime = 'nodejs'   // needs fetch with revalidate + abort signal

export async function GET(req: Request) {
  const ip = getIP(req)
  const { searchParams } = new URL(req.url)

  const params: JobSearchParams = {
    query:   searchParams.get('q')       || undefined,
    country: (searchParams.get('country') || 'ALL') as any,
    sector:  searchParams.get('sector')  || undefined,
    jobType: (searchParams.get('type')   || 'ALL')  as any,
    remote:  searchParams.get('remote')  === 'true',
    fresh:   searchParams.get('fresh')   === 'true',
    lang:    (searchParams.get('lang')   || 'all')  as any,
    page:    parseInt(searchParams.get('page')  || '1',  10),
    limit:   parseInt(searchParams.get('limit') || '20', 10),
  }

  track({
    name: 'ai.assist',
    ip,
    data: { op: 'job_search', query: params.query, country: params.country },
  })

  const result = await searchJobs(params)
  return json(result)
}
