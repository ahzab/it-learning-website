declare const process: { env: Record<string, string | undefined> }
// app/api/admin/stats/route.ts
// Internal admin endpoint — protected by ADMIN_SECRET header.
// Returns real-time stats from the AuditLog for the monitoring dashboard.

import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

function auth(req: NextRequest): boolean {
  const secret = (process.env as Record<string,string|undefined>).ADMIN_SECRET
  if (!secret) return false
  return req.headers.get('x-admin-secret') === secret
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return new Response('Forbidden', { status: 403 })

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const since1h  = new Date(Date.now() - 60 * 60 * 1000)

  const [
    eventCounts24h,
    criticals24h,
    aiLatency,
    topUsers,
    recentCriticals,
    planBreakdown,
    hourlyAI,
  ] = await Promise.all([

    // Event counts last 24h grouped by event name
    (prisma as any).auditLog.groupBy({
      by: ['event'],
      where: { createdAt: { gte: since24h } },
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
      take: 20,
    }),

    // Critical events last 24h
    (prisma as any).auditLog.count({
      where: { severity: 'critical', createdAt: { gte: since24h } },
    }),

    // Average AI latency last 1h
    (prisma as any).auditLog.aggregate({
      where: {
        event: { in: ['ai.generate_cv', 'ai.tailor_cv', 'ai.intelligence', 'ai.assist'] },
        createdAt: { gte: since1h },
        durationMs: { not: null },
      },
      _avg: { durationMs: true },
      _max: { durationMs: true },
      _count: { durationMs: true },
    }),

    // Top AI users last 24h
    (prisma as any).auditLog.groupBy({
      by: ['userId'],
      where: {
        event: { startsWith: 'ai.' },
        userId: { not: null },
        createdAt: { gte: since24h },
      },
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
      take: 10,
    }),

    // Last 20 critical events
    (prisma as any).auditLog.findMany({
      where: { severity: 'critical' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, event: true, userId: true, ip: true, meta: true, createdAt: true },
    }),

    // Plan breakdown of recent AI users
    (prisma as any).auditLog.groupBy({
      by: ['plan'],
      where: {
        event: { startsWith: 'ai.' },
        createdAt: { gte: since24h },
      },
      _count: { plan: true },
    }),

    // AI calls per hour last 24h (approximate — group by hour using raw)
    (prisma as any).auditLog.findMany({
      where: {
        event: { startsWith: 'ai.' },
        createdAt: { gte: since24h },
      },
      select: { event: true, createdAt: true, durationMs: true },
      orderBy: { createdAt: 'asc' },
    }),

  ])

  return new Response(JSON.stringify({
    eventCounts24h,
    criticals24h,
    aiLatency: {
      avgMs:  Math.round(aiLatency._avg?.durationMs ?? 0),
      maxMs:  aiLatency._max?.durationMs ?? 0,
      count:  aiLatency._count?.durationMs ?? 0,
    },
    topUsers,
    recentCriticals,
    planBreakdown,
    hourlyAI,
    generatedAt: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
