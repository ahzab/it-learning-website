// lib/validation/apiValidate.ts
// Server-side validation helper for Next.js API routes.
// Parses request body with a Zod schema and returns a typed result or
// a ready-to-return NextResponse error.

import { NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

export type ValidatedResult<T> =
  | { ok: true;  data: T }
  | { ok: false; response: NextResponse }

/**
 * Parse and validate the JSON body of a NextRequest.
 * On failure returns a 400 JSON response with structured field errors.
 *
 * Usage:
 *   const result = await apiValidate(req, registerSchema)
 *   if (!result.ok) return result.response
 *   const { name, email, password } = result.data
 */
export async function apiValidate<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<ValidatedResult<T>> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body', fields: {} },
        { status: 400 },
      ),
    }
  }

  const result = schema.safeParse(body)
  if (result.success) {
    return { ok: true, data: result.data }
  }

  // Build per-field error map for frontend to consume
  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_root'
    if (!fields[field]) fields[field] = issue.message
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        error:  'Validation failed',
        fields,
        issues: result.error.issues.map(i => ({
          path:    i.path,
          message: i.message,
          code:    i.code,
        })),
      },
      { status: 422 },
    ),
  }
}

/**
 * Lightweight guard: parse body synchronously from already-read JSON.
 * Use when you've already called req.json() elsewhere.
 */
export function validateBody<T>(
  body: unknown,
  schema: ZodSchema<T>,
): ValidatedResult<T> {
  const result = schema.safeParse(body)
  if (result.success) return { ok: true, data: result.data }

  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_root'
    if (!fields[field]) fields[field] = issue.message
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: 'Validation failed', fields },
      { status: 422 },
    ),
  }
}
