// lib/services/ai.service.ts
// All AI business logic — generate, tailor, assist, intelligence.
// Web and mobile routes both call these functions.
// Streaming vs JSON response is handled here, not in routes.

import { logger } from '@/lib/utils/logger'

const log = logger('ai.service')

import {
  callClaude,
  callClaudeJSON,
  callClaudeStream,
  AnthropicError,
  ParseError,
} from '@/lib/ai/anthropic'
import {
  CV_WRITER_SYSTEM,
  CV_GENERATE_SYSTEM,
  CV_TAILOR_SYSTEM,
  INTELLIGENCE_SYSTEM,
  LINKEDIN_EXTRACT_SYSTEM,
  buildAIPrompt,
  buildGeneratePrompt,
  buildTailorPrompt,
  buildIntelligencePrompt,
  buildLinkedInExtractPrompt,
  type AIAction,
  type AIContext,
} from '@/lib/ai/prompts'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TailorResult {
  cv:            Record<string, unknown>
  changes:       { field: string; reason: string }[]
  matchScore:    number
  missingSkills: string[]
  jobKeywords:   string[]
}

export type AIServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; code: 'AI_ERROR' | 'PARSE_ERROR' | 'UNKNOWN'; message: string; status: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function handleError(e: unknown): AIServiceResult<never> {
  if (e instanceof AnthropicError) {
    return { ok: false, code: 'AI_ERROR',    message: e.message, status: e.statusCode >= 500 ? 502 : 500 }
  }
  if (e instanceof ParseError) {
    return { ok: false, code: 'PARSE_ERROR', message: e.message, status: 500 }
  }
  log.error('unhandled', e)
  return { ok: false, code: 'UNKNOWN', message: 'AI request failed', status: 500 }
}

// ── CV Assist (streaming — builder panel) ─────────────────────────────────────

/**
 * Run a single AI writing action and return a streaming Response.
 * Used by the web builder's real-time AI panel.
 */
export async function streamAIAssist(
  action: AIAction,
  context: AIContext,
): Promise<AIServiceResult<Response>> {
  try {
    const stream = await callClaudeStream({
      system:    CV_WRITER_SYSTEM,
      messages:  [{ role: 'user', content: buildAIPrompt(action, context) }],
      maxTokens: 1024,
    })
    return { ok: true, data: stream }
  } catch (e) {
    return handleError(e)
  }
}

/**
 * Run a single AI writing action and return the full text.
 * Used by the mobile API which doesn't support SSE streaming.
 */
export async function runAIAssist(
  action: AIAction,
  context: AIContext,
): Promise<AIServiceResult<string>> {
  try {
    const { text } = await callClaude({
      system:    CV_WRITER_SYSTEM,
      messages:  [{ role: 'user', content: buildAIPrompt(action, context) }],
      maxTokens: 1024,
    })
    return { ok: true, data: text }
  } catch (e) {
    return handleError(e)
  }
}

// ── CV Generate ───────────────────────────────────────────────────────────────

/**
 * Generate a complete CV JSON from a free-text description.
 * Used by both web and mobile generate endpoints.
 */
export async function generateCV(
  description: string,
  lang: string = 'auto',
): Promise<AIServiceResult<Record<string, unknown>>> {
  try {
    const cv = await callClaudeJSON<Record<string, unknown>>({
      system:    CV_GENERATE_SYSTEM,
      messages:  [{ role: 'user', content: buildGeneratePrompt(description, lang) }],
      maxTokens: 4096,
    })
    return { ok: true, data: cv }
  } catch (e) {
    return handleError(e)
  }
}

// ── CV Tailor ─────────────────────────────────────────────────────────────────

/**
 * Tailor an existing CV for a specific job posting.
 * Used by both web and mobile tailor endpoints.
 */
export async function tailorCV(
  cv:             Record<string, unknown>,
  jobDescription: string,
  jobTitle?:      string,
  company?:       string,
): Promise<AIServiceResult<TailorResult>> {
  try {
    const result = await callClaudeJSON<TailorResult>({
      system:    CV_TAILOR_SYSTEM,
      messages:  [{ role: 'user', content: buildTailorPrompt(cv, jobDescription, jobTitle, company) }],
      maxTokens: 6000,
    })
    return { ok: true, data: result }
  } catch (e) {
    return handleError(e)
  }
}

// ── Career Intelligence ───────────────────────────────────────────────────────

/**
 * Analyse a CV and return a structured MENA market intelligence report.
 * Used by the web intelligence endpoint (mobile can call this too when added).
 */
export async function analyseCV(
  cv: Record<string, unknown>,
): Promise<AIServiceResult<Record<string, unknown>>> {
  try {
    const report = await callClaudeJSON<Record<string, unknown>>({
      system:    INTELLIGENCE_SYSTEM,
      messages:  [{ role: 'user', content: buildIntelligencePrompt(cv) }],
      maxTokens: 4096,
    })
    return { ok: true, data: report }
  } catch (e) {
    return handleError(e)
  }
}

// ── LinkedIn Profile Import ───────────────────────────────────────────────────

/**
 * Parse raw LinkedIn profile text into structured CV data.
 * The text is whatever the user copies from their public LinkedIn profile page.
 */
export async function importFromLinkedIn(
  rawText: string,
): Promise<AIServiceResult<Record<string, unknown>>> {
  try {
    const cv = await callClaudeJSON<Record<string, unknown>>({
      system:    LINKEDIN_EXTRACT_SYSTEM,
      messages:  [{ role: 'user', content: buildLinkedInExtractPrompt(rawText) }],
      maxTokens: 4096,
    })
    return { ok: true, data: cv }
  } catch (e) {
    return handleError(e)
  }
}
