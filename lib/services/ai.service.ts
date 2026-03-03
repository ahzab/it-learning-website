// lib/services/ai.service.ts
import { logger } from '@/lib/utils/logger'
import { track, trackTimed } from '@/lib/observability'
import {
  callClaude, callClaudeJSON, callClaudeStream,
  GeminiError as AnthropicError, ParseError,
} from '@/lib/ai/gemini'
import {
  CV_WRITER_SYSTEM, CV_GENERATE_SYSTEM, CV_TAILOR_SYSTEM,
  INTELLIGENCE_SYSTEM, LINKEDIN_EXTRACT_SYSTEM,
  buildAIPrompt, buildGeneratePrompt, buildTailorPrompt,
  buildIntelligencePrompt, buildLinkedInExtractPrompt,
  type AIAction, type AIContext,
} from '@/lib/ai/prompts'

const log = logger('ai.service')

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

function handleError(e: unknown, context?: string): AIServiceResult<never> {
  if (e instanceof AnthropicError) {
    track({ name: 'system.gemini_error', severity: 'critical',
      data: { context, status: e.statusCode, message: e.message } })
    return { ok: false, code: 'AI_ERROR', message: e.message, status: e.statusCode >= 500 ? 502 : 500 }
  }
  if (e instanceof ParseError) {
    track({ name: 'ai.error', severity: 'warn',
      data: { context, type: 'parse_error', message: e.message } })
    return { ok: false, code: 'PARSE_ERROR', message: e.message, status: 500 }
  }
  log.error('unhandled', e)
  track({ name: 'ai.error', severity: 'critical',
    data: { context, type: 'unknown', error: String(e) } })
  return { ok: false, code: 'UNKNOWN', message: 'AI request failed', status: 500 }
}

export async function streamAIAssist(
  action: AIAction,
  context: AIContext,
  meta?: { userId?: string; ip?: string },
): Promise<AIServiceResult<Response>> {
  const t0 = Date.now()
  try {
    const stream = await callClaudeStream({
      system:    CV_WRITER_SYSTEM,
      messages:  [{ role: 'user', content: buildAIPrompt(action, context) }],
      maxTokens: 1024,
    })
    const ms = Date.now() - t0
    if (ms > 15_000) track({ name: 'system.gemini_latency_high', severity: 'warn',
      userId: meta?.userId, ip: meta?.ip, data: { op: 'streamAIAssist', action, durationMs: ms } })
    return { ok: true, data: stream }
  } catch (e) {
    return handleError(e, `streamAIAssist:${action}`)
  }
}

export async function runAIAssist(
  action: AIAction,
  context: AIContext,
  meta?: { userId?: string; ip?: string },
): Promise<AIServiceResult<string>> {
  const t0 = Date.now()
  try {
    const { text } = await callClaude({
      system:    CV_WRITER_SYSTEM,
      messages:  [{ role: 'user', content: buildAIPrompt(action, context) }],
      maxTokens: 1024,
    })
    const ms = Date.now() - t0
    if (ms > 15_000) track({ name: 'system.gemini_latency_high', severity: 'warn',
      userId: meta?.userId, ip: meta?.ip, data: { op: 'runAIAssist', action, durationMs: ms } })
    return { ok: true, data: text }
  } catch (e) {
    return handleError(e, `runAIAssist:${action}`)
  }
}

export async function generateCV(
  description: string,
  lang: string = 'auto',
  meta?: { userId?: string; ip?: string },
): Promise<AIServiceResult<Record<string, unknown>>> {
  const t0 = Date.now()
  try {
    const cv = await callClaudeJSON<Record<string, unknown>>({
      system:    CV_GENERATE_SYSTEM,
      messages:  [{ role: 'user', content: buildGeneratePrompt(description, lang) }],
      maxTokens: 4096,
    })
    const ms = Date.now() - t0
    track({ name: 'ai.generate_cv', userId: meta?.userId, ip: meta?.ip,
      data: { lang, durationMs: ms, descLen: description.length } })
    if (ms > 15_000) track({ name: 'system.gemini_latency_high', severity: 'warn',
      userId: meta?.userId, data: { op: 'generateCV', durationMs: ms } })
    return { ok: true, data: cv }
  } catch (e) {
    return handleError(e, 'generateCV')
  }
}

export async function tailorCV(
  cv:             Record<string, unknown>,
  jobDescription: string,
  jobTitle?:      string,
  company?:       string,
  meta?:          { userId?: string; ip?: string },
): Promise<AIServiceResult<TailorResult>> {
  const t0 = Date.now()
  try {
    const result = await callClaudeJSON<TailorResult>({
      system:    CV_TAILOR_SYSTEM,
      messages:  [{ role: 'user', content: buildTailorPrompt(cv, jobDescription, jobTitle, company) }],
      maxTokens: 6000,
    })
    const ms = Date.now() - t0
    track({ name: 'ai.tailor_cv', userId: meta?.userId, ip: meta?.ip,
      data: { jobTitle, company, matchScore: result.matchScore, durationMs: ms } })
    return { ok: true, data: result }
  } catch (e) {
    return handleError(e, 'tailorCV')
  }
}

export async function analyseCV(
  cv:   Record<string, unknown>,
  meta?: { userId?: string; ip?: string },
): Promise<AIServiceResult<Record<string, unknown>>> {
  const t0 = Date.now()
  try {
    const report = await callClaudeJSON<Record<string, unknown>>({
      system:    INTELLIGENCE_SYSTEM,
      messages:  [{ role: 'user', content: buildIntelligencePrompt(cv) }],
      maxTokens: 4096,
    })
    const ms = Date.now() - t0
    track({ name: 'ai.intelligence', userId: meta?.userId, ip: meta?.ip,
      data: { durationMs: ms } })
    return { ok: true, data: report }
  } catch (e) {
    return handleError(e, 'analyseCV')
  }
}

export async function importFromLinkedIn(
  rawText: string,
  meta?:   { userId?: string; ip?: string },
): Promise<AIServiceResult<Record<string, unknown>>> {
  const t0 = Date.now()
  try {
    const cv = await callClaudeJSON<Record<string, unknown>>({
      system:    LINKEDIN_EXTRACT_SYSTEM,
      messages:  [{ role: 'user', content: buildLinkedInExtractPrompt(rawText) }],
      maxTokens: 4096,
    })
    const ms = Date.now() - t0
    track({ name: 'ai.linkedin_import', userId: meta?.userId, ip: meta?.ip,
      data: { durationMs: ms, textLen: rawText.length } })
    return { ok: true, data: cv }
  } catch (e) {
    return handleError(e, 'importFromLinkedIn')
  }
}
