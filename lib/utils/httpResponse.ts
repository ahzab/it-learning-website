// lib/utils/httpResponse.ts
// Typed shorthand response helpers for Next.js web API routes.
// Eliminates repeated NextResponse.json({ error: '…' }, { status: … }) calls.
//
// All helpers are thin wrappers — the shape is intentionally identical to what
// apiValidate already returns so every error the client receives looks the same.
//
// Usage:
//   import { unauthorized, notFound, serverError } from '@/lib/utils/httpResponse'
//   if (!session?.user?.id) return unauthorized()
//   if (!cv) return notFound('CV')

import { NextResponse } from 'next/server'

// ── 4xx ──────────────────────────────────────────────────────────────────────

/** 401 — caller is not authenticated */
export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/** 403 — caller is authenticated but not allowed */
export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/** 404 — resource not found */
export function notFound(resource = 'Resource'): NextResponse {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

/** 400 — malformed request (non-Zod, e.g. missing param) */
export function badRequest(message: string, fields?: Record<string, string>): NextResponse {
  return NextResponse.json({ error: message, ...(fields ? { fields } : {}) }, { status: 400 })
}

/** 409 — conflict (e.g. email already in use) */
export function conflict(message: string, fields?: Record<string, string>): NextResponse {
  return NextResponse.json({ error: message, ...(fields ? { fields } : {}) }, { status: 409 })
}

// ── 5xx ──────────────────────────────────────────────────────────────────────

/** 500 — unexpected server error */
export function serverError(message = 'Internal server error'): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 })
}

/** 502 — upstream dependency (AI, Stripe, etc.) failed */
export function upstreamError(message = 'Upstream service error'): NextResponse {
  return NextResponse.json({ error: message }, { status: 502 })
}

// ── 2xx ──────────────────────────────────────────────────────────────────────

/** 201 Created */
export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 })
}

/** 200 OK with JSON data */
export function json<T>(data: T): NextResponse {
  return NextResponse.json(data)
}

// ── AI service result → NextResponse mapper ───────────────────────────────────

export interface AIServiceResult<T = unknown> {
  ok:       boolean
  data?:    T
  message?: string
  status?:  number
  code?:    string
}

/**
 * Map an AIServiceResult to a NextResponse.
 * The success branch lets you transform the data before responding.
 *
 * Usage:
 *   const result = await aiService.generateCV(...)
 *   return mapAIResult(result, data => ({ cv: data }))
 */
export function mapAIResult<T, R = T>(
  result: AIServiceResult<T>,
  transform?: (data: T) => R,
): NextResponse {
  if (!result.ok) {
    const status = result.status ?? 500
    return NextResponse.json({ error: result.message ?? 'AI request failed' }, { status })
  }
  const out = transform ? transform(result.data as T) : result.data
  return NextResponse.json(out)
}
