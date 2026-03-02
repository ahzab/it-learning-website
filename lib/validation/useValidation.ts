'use client'
// lib/validation/useValidation.ts
// Validation hook that tracks touched fields and shows per-field errors
// after the user has blurred each input (or attempted submission).

import { useState, useCallback } from 'react'
import { z, ZodSchema } from 'zod'
import { useT } from '@/lib/i18n/context'
import type { Translations } from '@/lib/i18n'

// ── i18n resolver ─────────────────────────────────────────────────────────────
// Zod error messages are dot-path i18n keys like "validation.email.invalid".
// This drills into t.validation to find the translated string.
export function resolveValidationMessage(key: string, t: Translations): string {
  if (!key.startsWith('validation.')) return key
  const parts = key.replace('validation.', '').split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = (t as any).validation
  for (const p of parts) {
    if (node === null || typeof node !== 'object') return key
    node = node[p]
  }
  return typeof node === 'string' ? node : key
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type FieldErrors = Record<string, string>

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useValidation<T>(schema: ZodSchema<T>) {
  const { t } = useT()
  const [errors,  setErrors]  = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  /** Resolve a raw Zod message to a translated string */
  const resolve = useCallback(
    (msg: string) => msg.startsWith('validation.') ? resolveValidationMessage(msg, t) : msg,
    [t],
  )

  /**
   * Validate the full object. Marks all fields as touched so all errors show.
   * Returns true if valid.
   */
  const validate = useCallback(
    (data: unknown): data is T => {
      const result = schema.safeParse(data)
      if (result.success) {
        setErrors({})
        return true
      }
      const map: FieldErrors = {}
      const allTouched = new Set<string>()
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || '_root'
        allTouched.add(field)
        if (!map[field]) map[field] = resolve(issue.message)
      }
      setErrors(map)
      setTouched(prev => new Set([...prev, ...allTouched]))
      return false
    },
    [schema, resolve],
  )

  /**
   * Mark a single field as touched (called onBlur).
   * Tries to validate it by running the full schema with current data
   * and picking out that field's error.
   */
  const touch = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field))
  }, [])

  /**
   * Validate a single field's value using a dedicated field-level schema.
   * Use this when you want immediate inline feedback without full-object context.
   */
  const validateField = useCallback(
    (field: string, fieldSchema: ZodSchema, value: unknown) => {
      setTouched(prev => new Set(prev).add(field))
      const result = fieldSchema.safeParse(value)
      if (result.success) {
        setErrors(prev => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      } else {
        const msg = result.error.issues[0]?.message ?? 'validation.required'
        setErrors(prev => ({ ...prev, [field]: resolve(msg) }))
      }
    },
    [resolve],
  )

  /**
   * Set a server-returned error on a specific field.
   * Use after receiving a 422 response from the backend.
   */
  const setServerErrors = useCallback((fields: Record<string, string>) => {
    const resolved: FieldErrors = {}
    for (const [k, v] of Object.entries(fields)) {
      resolved[k] = resolve(v)
    }
    setErrors(prev => ({ ...prev, ...resolved }))
    setTouched(prev => new Set([...prev, ...Object.keys(fields)]))
  }, [resolve])

  /** Return error for a field ONLY if it's been touched */
  const fieldError = useCallback(
    (field: string): string | undefined => touched.has(field) ? errors[field] : undefined,
    [errors, touched],
  )

  /** Return raw error regardless of touch state (use for submit-time display) */
  const rawError = useCallback(
    (field: string): string | undefined => errors[field],
    [errors],
  )

  /** Clear all validation state */
  const reset = useCallback(() => {
    setErrors({})
    setTouched(new Set())
  }, [])

  /** Clear error for a specific field */
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  return {
    errors,
    touched,
    isValid:          Object.keys(errors).length === 0,
    validate,
    validateField,
    touch,
    fieldError,
    rawError,
    setServerErrors,
    reset,
    clearError,
  }
}
