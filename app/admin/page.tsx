'use client'
// app/admin/page.tsx
// Internal monitoring dashboard — not linked from the UI.
// Access: /admin?secret=YOUR_ADMIN_SECRET
// Shows: live event counts, critical alarms, AI latency, top users by usage.

import { useState, useEffect, useCallback } from 'react'

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#EF4444', warn: '#F59E0B', info: '#22C55E',
}
const EVENT_EMOJI: Record<string, string> = {
  'ai.generate_cv': '🧠', 'ai.tailor_cv': '✂️', 'ai.intelligence': '📊',
  'ai.assist': '✦', 'ai.credits_exhausted': '🔴', 'ai.plan_gate_hit': '🔒',
  'auth.register': '👤', 'auth.login': '🔑', 'auth.login_failed': '⚠️',
  'auth.brute_force_suspected': '🚨', 'cv.created': '📄', 'cv.deleted': '🗑️',
  'payment.succeeded': '💚', 'payment.failed': '💔', 'payment.webhook_error': '🚨',
  'security.unauthorized': '🛡️', 'system.gemini_error': '🔥', 'system.gemini_latency_high': '🐢',
  'system.db_error': '💾',
}

interface Stats {
  eventCounts24h:   { event: string; _count: { event: number } }[]
  criticals24h:     number
  aiLatency:        { avgMs: number; maxMs: number; count: number }
  topUsers:         { userId: string; _count: { event: number } }[]
  recentCriticals:  { id: string; event: string; userId: string | null; ip: string | null; meta: string | null; createdAt: string }[]
  planBreakdown:    { plan: string | null; _count: { plan: number } }[]
  generatedAt:      string
}

function StatCard({ label, value, sub, color = '#C9A84C' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px' }}>
      <div style={{ fontSize: 11, color: '#6B6672', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#4A4550', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [stats,  setStats]  = useState<Stats | null>(null)
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const load = useCallback(async (s: string) => {
    if (!s) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-secret': s } })
      if (res.status === 403) { setError('Invalid admin secret'); setLoading(false); return }
      setStats(await res.json())
    } catch { setError('Failed to load stats') }
    setLoading(false)
  }, [])

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('secret') ?? ''
    if (s) { setSecret(s); load(s) }
  }, [load])

  useEffect(() => {
    if (!autoRefresh || !secret) return
    const id = setInterval(() => load(secret), 30_000)
    return () => clearInterval(id)
  }, [autoRefresh, secret, load])

  const totalAI = stats?.eventCounts24h
    .filter(e => e.event.startsWith('ai.'))
    .reduce((s, e) => s + e._count.event, 0) ?? 0

  const alarmsNeedAttention = (stats?.criticals24h ?? 0) > 0

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#F0EBE0', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
              سيرتي.ai — Internal Dashboard
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Observability</h1>
            {stats && <div style={{ fontSize: 12, color: '#4A4550', marginTop: 4 }}>Last refresh: {new Date(stats.generatedAt).toLocaleTimeString()}</div>}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: '#6B6672', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
              Auto-refresh (30s)
            </label>
            {!stats && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Admin secret"
                  type="password"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && load(secret)}
                  style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#F0EBE0', fontSize: 13 }}
                />
                <button
                  onClick={() => load(secret)}
                  style={{ background: '#C9A84C', color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>
                  Load
                </button>
              </div>
            )}
            {stats && (
              <button onClick={() => load(secret)} disabled={loading}
                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', color: '#9994A0', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700 }}>
                {loading ? '...' : '↺ Refresh'}
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#EF4444', marginBottom: 24 }}>{error}</div>}

        {loading && !stats && <div style={{ textAlign: 'center', color: '#4A4550', padding: 80 }}>Loading stats...</div>}

        {stats && (<>

          {/* Critical alarm banner */}
          {alarmsNeedAttention && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🚨</span>
              <div>
                <div style={{ color: '#EF4444', fontWeight: 700 }}>{stats.criticals24h} critical event{stats.criticals24h !== 1 ? 's' : ''} in the last 24h</div>
                <div style={{ color: '#6B6672', fontSize: 12, marginTop: 2 }}>Scroll down to see details — check Slack for alerts</div>
              </div>
            </div>
          )}

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard label="AI Calls (24h)" value={totalAI} color="#C9A84C" />
            <StatCard label="Critical Alarms (24h)" value={stats.criticals24h} color={alarmsNeedAttention ? '#EF4444' : '#22C55E'} />
            <StatCard label="Avg AI Latency (1h)" value={`${stats.aiLatency.avgMs}ms`} sub={`Max: ${stats.aiLatency.maxMs}ms`} color={stats.aiLatency.avgMs > 8000 ? '#F59E0B' : '#22C55E'} />
            <StatCard label="AI Calls Timed (1h)" value={stats.aiLatency.count} color="#06B6D4" />
          </div>

          {/* Plan breakdown + Top users side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

            {/* Plan breakdown */}
            <div style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 11, color: '#6B6672', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>AI Usage by Plan (24h)</div>
              {stats.planBreakdown.map(p => {
                const total = stats.planBreakdown.reduce((s, x) => s + x._count.plan, 0)
                const pct   = total > 0 ? Math.round((p._count.plan / total) * 100) : 0
                const color = p.plan === 'PRO' ? '#C9A84C' : p.plan === 'STARTER' ? '#06B6D4' : '#4A4550'
                return (
                  <div key={p.plan ?? 'null'} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color, fontWeight: 700 }}>{p.plan ?? 'FREE'}</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#9994A0' }}>{p._count.plan} ({pct}%)</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top users */}
            <div style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 11, color: '#6B6672', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Top AI Users (24h)</div>
              {stats.topUsers.slice(0, 8).map((u, i) => (
                <div key={u.userId ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#3A3742', fontFamily: 'monospace', width: 20 }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, color: '#9994A0', fontFamily: 'monospace' }}>
                      {u.userId ? u.userId.slice(0, 16) + '...' : '—'}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: u._count.event > 15 ? '#EF4444' : '#F0EBE0', fontFamily: 'monospace' }}>
                    {u._count.event} calls
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Event counts */}
          <div style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#6B6672', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Event Counts (24h)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {stats.eventCounts24h.map(e => (
                <div key={e.event} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13 }}>{EVENT_EMOJI[e.event] ?? '·'} <span style={{ color: '#9994A0' }}>{e.event}</span></span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#F0EBE0' }}>{e._count.event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent critical events */}
          <div style={{ background: '#0D0D1A', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>🚨 Recent Critical Events</div>
            {stats.recentCriticals.length === 0 && (
              <div style={{ color: '#22C55E', fontSize: 14 }}>✓ No critical events — all clear</div>
            )}
            {stats.recentCriticals.map(ev => {
              let meta: Record<string, unknown> = {}
              try { meta = JSON.parse(ev.meta ?? '{}') } catch {}
              return (
                <div key={ev.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{EVENT_EMOJI[ev.event] ?? '🔴'}</span>
                      <span style={{ fontWeight: 700, color: '#EF4444', fontSize: 14 }}>{ev.event}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#4A4550', fontFamily: 'monospace' }}>
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B6672', marginLeft: 23 }}>
                    {ev.userId && <span style={{ marginRight: 12 }}>user: <code style={{ color: '#9994A0' }}>{ev.userId.slice(0, 12)}…</code></span>}
                    {ev.ip && ev.ip !== 'unknown' && <span style={{ marginRight: 12 }}>ip: <code style={{ color: '#9994A0' }}>{ev.ip}</code></span>}
                    {Object.entries(meta).slice(0, 3).map(([k, v]) => (
                      <span key={k} style={{ marginRight: 12 }}>{k}: <code style={{ color: '#9994A0' }}>{String(v).slice(0, 60)}</code></span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

        </>)}
      </div>
    </div>
  )
}
