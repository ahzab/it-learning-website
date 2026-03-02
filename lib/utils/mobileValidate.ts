// lib/utils/mobileValidate.ts
// Replaces the repeated 12-line "parse JSON → safeParse → build fields map → err()"
// block that was copy-pasted into every mobile route.
//
// Usage:
//   const v = await parseMobileBody(req, mySchema)
//   if (!v.ok) return v.response
//   const { field1, field2 } = v.data

import { ZodSchema } from 'zod'
import { err } from '@/lib/mobile-auth'

// ── Result type ───────────────────────────────────────────────────────────────

export type MobileParseResult<T> =
  | { ok: true;  data: T }
  | { ok: false; response: Response }

// ── parseMobileBody ───────────────────────────────────────────────────────────

/**
 * Parse request JSON and validate with a Zod schema.
 *
 * On invalid JSON   → 400 INVALID_JSON
 * On schema failure → 422 VALIDATION_ERROR with per-field errors
 * On success        → { ok: true, data }
 */
export async function parseMobileBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<MobileParseResult<T>> {
  // 1. Parse raw JSON
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return { ok: false, response: err('Invalid JSON body', 400, 'INVALID_JSON') }
  }

  return parseMobileData(body, schema)
}

/**
 * Validate an already-read value with a Zod schema.
 * Use when you've already called req.json() and need to validate a sub-object.
 */
export function parseMobileData<T>(
  data: unknown,
  schema: ZodSchema<T>,
): MobileParseResult<T> {
  const result = schema.safeParse(data)

  if (result.success) return { ok: true, data: result.data }

  // Build a per-field error map identical to what the web apiValidate returns,
  // so mobile and web clients can use the same error-handling code.
  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_root'
    if (!fields[field]) fields[field] = issue.message
  }

  return {
    ok: false,
    response: err('Validation failed', 422, 'VALIDATION_ERROR', { fields }),
  }
}
