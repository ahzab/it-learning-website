// lib/observability/index.ts
// Seerti Observability: structured events + sliding-window alarms + Slack/PD alerting.
// Designed as fire-and-forget — never awaited in the critical request path.

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

const log = logger('obs')

// ── Event catalogue ───────────────────────────────────────────────────────────

export type EventName =
  | 'auth.register' | 'auth.login' | 'auth.login_failed' | 'auth.brute_force_suspected'
  | 'ai.assist' | 'ai.generate_cv' | 'ai.tailor_cv' | 'ai.intelligence'
  | 'ai.linkedin_import' | 'ai.error' | 'ai.credits_exhausted' | 'ai.plan_gate_hit'
  | 'ai.anomaly_rate' | 'ai.high_cost_user'
  | 'cv.created' | 'cv.updated' | 'cv.deleted' | 'cv.limit_hit'
  | 'payment.checkout_started' | 'payment.succeeded' | 'payment.failed'
  | 'payment.refunded' | 'payment.webhook_error'
  | 'security.unauthorized' | 'security.rate_limited'
  | 'security.invalid_payload' | 'security.suspicious_ip'
  | 'system.gemini_error' | 'system.gemini_latency_high' | 'system.db_error'

export interface TrackEvent {
  name:       EventName
  userId?:    string
  plan?:      string
  ip?:        string
  data?:      Record<string, unknown>
  durationMs?: number
  severity?:  'info' | 'warn' | 'critical'
}

// ── Alarm thresholds ──────────────────────────────────────────────────────────

const ALARMS = {
  AI_CALLS_PER_USER_PER_MIN: 20,
  AI_LATENCY_MS:             15_000,
  AI_ERROR_RATE_PCT:         10,
  LOGIN_FAILURES_PER_IP:     5,
  CREDIT_BURN_10MIN:         15,
} as const

// ── In-memory sliding windows (no Redis needed) ───────────────────────────────

interface Win  { count: number; firstAt: number }
interface CWin { count: number; credits: number; firstAt: number }

const WIN = {
  aiCalls:    new Map<string, Win>(),
  loginFails: new Map<string, Win>(),
  creditBurn: new Map<string, CWin>(),
  geminiErr:  { count: 0, total: 0, windowStart: Date.now() },
}

function incWindow(map: Map<string, Win>, key: string, windowMs: number): number {
  const now = Date.now()
  const e   = map.get(key)
  if (!e || now - e.firstAt > windowMs) { map.set(key, { count: 1, firstAt: now }); return 1 }
  return ++e.count
}

// ── Alert dispatcher ──────────────────────────────────────────────────────────

async function alert(level: 'warn' | 'critical', title: string, detail: Record<string, unknown>) {
  const ts  = new Date().toISOString()
  const msg = { title, level, ...detail, ts }

  level === 'critical' ? log.error(title, msg) : log.warn(title, msg)

  // Slack
  const slackUrl = process.env.SLACK_WEBHOOK_URL
  if (slackUrl) {
    const emoji = level === 'critical' ? ':rotating_light:' : ':warning:'
    const color = level === 'critical' ? '#FF0000' : '#FFA500'
    await fetch(slackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `${emoji} سيرتي.ai | ${title}`,
          fields: Object.entries(detail).map(([k, v]) => ({ title: k, value: String(v), short: true })),
          footer: `seerti-api • ${ts}`,
          ts: Math.floor(Date.now() / 1000),
        }],
      }),
    }).catch(e => log.error('slack.alert.failed', e))
  }

  // PagerDuty — critical only
  const pdKey = process.env.PAGERDUTY_ROUTING_KEY
  if (pdKey && level === 'critical') {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: pdKey, event_action: 'trigger',
        payload: { summary: `سيرتي.ai CRITICAL: ${title}`, severity: 'critical', source: 'seerti-api', custom_details: detail },
      }),
    }).catch(() => {})
  }
}

// ── Alarm checks ──────────────────────────────────────────────────────────────

async function checkAlarms(e: TrackEvent) {
  const { name, userId, ip, data, durationMs, plan } = e

  // AI rate spike
  if (name.startsWith('ai.') && userId) {
    const n = incWindow(WIN.aiCalls, userId, 60_000)
    if (n === ALARMS.AI_CALLS_PER_USER_PER_MIN)
      await alert('warn', 'AI rate spike — possible scraping', { userId, callsPerMin: n, plan: plan ?? '?' })
  }

  // Credit farming
  if (name.startsWith('ai.') && userId && data?.creditsUsed) {
    const cost = Number(data.creditsUsed) || 1
    const now  = Date.now()
    const cw   = WIN.creditBurn.get(userId)
    if (!cw || now - cw.firstAt > 10 * 60_000) {
      WIN.creditBurn.set(userId, { count: 1, credits: cost, firstAt: now })
    } else {
      cw.credits += cost; cw.count++
      if (cw.credits >= ALARMS.CREDIT_BURN_10MIN) {
        WIN.creditBurn.delete(userId)
        await alert('critical', 'Credit farming detected', { userId, creditsIn10Min: cw.credits, plan: plan ?? '?' })
      }
    }
  }

  // Gemini latency
  if (durationMs && durationMs > ALARMS.AI_LATENCY_MS && name.startsWith('ai.'))
    await alert('warn', 'Gemini latency spike', { operation: name, durationMs, threshold: ALARMS.AI_LATENCY_MS })

  // Gemini error rate (5-min window)
  if (name === 'system.gemini_error' || name === 'ai.error') {
    WIN.geminiErr.total++; WIN.geminiErr.count++
    const ageSec = (Date.now() - WIN.geminiErr.windowStart) / 1000
    if (ageSec > 300) { WIN.geminiErr.count = 0; WIN.geminiErr.windowStart = Date.now() }
    else {
      const pct = (WIN.geminiErr.count / WIN.geminiErr.total) * 100
      if (pct > ALARMS.AI_ERROR_RATE_PCT && WIN.geminiErr.total > 10)
        await alert('critical', 'Gemini error rate elevated', { errorPct: pct.toFixed(1), errors: WIN.geminiErr.count })
    }
  }

  // Brute force
  if ((name === 'auth.login_failed' || name === 'auth.brute_force_suspected') && ip) {
    const n = incWindow(WIN.loginFails, ip, 5 * 60_000)
    if (n === ALARMS.LOGIN_FAILURES_PER_IP)
      await alert('critical', 'Brute force suspected', { ip, failsIn5Min: n })
  }

  // Payment webhook failure — always critical
  if (name === 'payment.webhook_error')
    await alert('critical', 'Stripe webhook FAILED — manual intervention required', { ...(data ?? {}) })

  // Any critical security event
  if (name === 'security.suspicious_ip')
    await alert('critical', 'Suspicious IP activity', { ip: ip ?? '?', ...(data ?? {}) })
}

// ── Persist to audit log ──────────────────────────────────────────────────────

async function persist(e: TrackEvent) {
  try {
    await (prisma as any).auditLog.create({
      data: {
        event:      e.name,
        userId:     e.userId   ?? null,
        plan:       e.plan     ?? null,
        ip:         e.ip       ?? null,
        severity:   e.severity ?? 'info',
        durationMs: e.durationMs ?? null,
        meta:       e.data ? JSON.stringify(e.data) : null,
      },
    })
  } catch {
    // Audit table not migrated yet — fail silently
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Fire-and-forget event tracking. Call from routes and services. */
export function track(event: TrackEvent): void {
  const { name, severity = 'info', userId, plan, data, durationMs } = event
  const entry = { event: name, userId, plan, durationMs, ...data }

  // Synchronous log — never blocks
  if (severity === 'critical') log.error(name, entry)
  else if (severity === 'warn') log.warn(name, entry)
  else log.info(name, entry)

  // Async work — fire-and-forget, never crash the caller
  Promise.allSettled([
    persist(event),
    checkAlarms(event),
  ]).catch(() => {})
}

/** Wrap an async fn: tracks latency + errors automatically */
export async function trackTimed<T>(
  name:  EventName,
  meta:  Omit<TrackEvent, 'name' | 'durationMs'>,
  fn:    () => Promise<T>,
): Promise<T> {
  const t0 = Date.now()
  try {
    const r = await fn()
    track({ name, ...meta, durationMs: Date.now() - t0 })
    return r
  } catch (e) {
    track({ name, ...meta, durationMs: Date.now() - t0, severity: 'critical', data: { ...(meta.data ?? {}), error: String(e) } })
    throw e
  }
}

/** Extract real client IP from Next.js Request */
export function getIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
}
