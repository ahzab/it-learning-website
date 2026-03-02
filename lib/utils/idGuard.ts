// lib/utils/idGuard.ts
// Validates route params that are expected to be CUIDs or UUIDs
// before they reach the database layer.
//
// Prevents SQL-injection-style issues and avoids unnecessary DB round-trips
// for obviously invalid IDs like "../admin" or "undefined".
//
// Usage (web):
//   const id = guardId(params.id)
//   if (!id.ok) return id.response   // NextResponse 400
//
// Usage (mobile):
//   const id = guardId(params.id, 'mobile')
//   if (!id.ok) return id.response   // err() Response

import { NextResponse } from 'next/server'
import { err } from '@/lib/mobile-auth'

// ── CUID v1 + v2 and UUID v4 patterns ────────────────────────────────────────

const CUID_RE  = /^c[a-z0-9]{24,}$/i
const CUIDV2_RE = /^[a-z0-9]{24,}$/i
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  const s = id.trim()
  return CUID_RE.test(s) || CUIDV2_RE.test(s) || UUID_RE.test(s)
}

// ── Result types ──────────────────────────────────────────────────────────────

export type IdGuardResult =
  | { ok: true;  id: string }
  | { ok: false; response: NextResponse | Response }

// ── guardId ───────────────────────────────────────────────────────────────────

/**
 * Validate a route param ID.
 *
 * @param rawId   - raw string from route params
 * @param target  - 'web' returns NextResponse, 'mobile' returns mobile err() Response
 */
export function guardId(rawId: string, target: 'web' | 'mobile' = 'web'): IdGuardResult {
  if (isValidId(rawId)) {
    return { ok: true, id: rawId.trim() }
  }

  const response =
    target === 'mobile'
      ? err('Invalid ID format', 400, 'INVALID_ID')
      : NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })

  return { ok: false, response }
}
