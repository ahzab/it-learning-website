// lib/services/cover-letter.service.ts
// All cover letter data-access and AI operations.

import { prisma } from '@/lib/prisma'
import { track } from '@/lib/observability'
import { callClaudeJSON, callClaude, GeminiError as AnthropicError, ParseError } from '@/lib/ai/gemini'
import {
  COVER_LETTER_SYSTEM,
  buildCoverLetterPrompt,
  buildCoverLetterImprovePrompt,
  type CoverLetterContext,
} from '@/lib/ai/prompts'
import { logger } from '@/lib/utils/logger'

const log = logger('cover-letter.service')

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoverLetterRecord {
  id:        string
  title:     string
  language:  string
  tone:      string
  content:   string
  contentEn: string | null
  jobTitle:  string | null
  company:   string | null
  cvId:      string | null
  createdAt: Date
  updatedAt: Date
}

export interface GenerateResult {
  subject:   string
  content:   string
  contentEn: string
  preview:   string
  keyPoints: string[]
}

export type CLServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; message: string; status: number }

function handleError(e: unknown, ctx?: string): CLServiceResult<never> {
  if (e instanceof AnthropicError) {
    track({ name: 'system.gemini_error', severity: 'critical',
      data: { ctx, status: e.statusCode, message: e.message } })
    return { ok: false, message: e.message, status: 502 }
  }
  if (e instanceof ParseError) {
    return { ok: false, message: 'AI returned an unexpected response', status: 500 }
  }
  log.error('cover-letter.service', e)
  return { ok: false, message: 'Cover letter generation failed', status: 500 }
}

// ── AI: Generate ──────────────────────────────────────────────────────────────

export async function generateCoverLetter(
  ctx:  CoverLetterContext,
  meta?: { userId?: string; ip?: string },
): Promise<CLServiceResult<GenerateResult>> {
  const t0 = Date.now()
  try {
    const result = await callClaudeJSON<GenerateResult>({
      system:    COVER_LETTER_SYSTEM,
      messages:  [{ role: 'user', content: buildCoverLetterPrompt(ctx) }],
      maxTokens: 3000,
    })
    track({ name: 'ai.generate_cv', userId: meta?.userId, ip: meta?.ip,
      data: { op: 'generate_cover_letter', tone: ctx.tone, lang: ctx.lang, durationMs: Date.now() - t0 } })
    return { ok: true, data: result }
  } catch (e) {
    return handleError(e, 'generateCoverLetter')
  }
}

// ── AI: Improve ───────────────────────────────────────────────────────────────

export async function improveCoverLetter(
  content:     string,
  instruction: string,
  lang:        'ar' | 'en',
  meta?:       { userId?: string; ip?: string },
): Promise<CLServiceResult<string>> {
  const t0 = Date.now()
  try {
    const { text } = await callClaude({
      system:    COVER_LETTER_SYSTEM,
      messages:  [{ role: 'user', content: buildCoverLetterImprovePrompt(content, instruction, lang) }],
      maxTokens: 2000,
    })
    track({ name: 'ai.assist', userId: meta?.userId, ip: meta?.ip,
      data: { op: 'improve_cover_letter', lang, durationMs: Date.now() - t0 } })
    return { ok: true, data: text }
  } catch (e) {
    return handleError(e, 'improveCoverLetter')
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function listCoverLetters(userId: string): Promise<CoverLetterRecord[]> {
  return (prisma as any).coverLetter.findMany({
    where:   { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, title: true, language: true, tone: true,
      content: true, contentEn: true, jobTitle: true,
      company: true, cvId: true, createdAt: true, updatedAt: true,
    },
  })
}

export async function getCoverLetterById(
  id: string, userId: string
): Promise<CoverLetterRecord | null> {
  return (prisma as any).coverLetter.findFirst({ where: { id, userId } })
}

export async function saveCoverLetter(
  userId:  string,
  data: {
    title?:     string
    content:    string
    contentEn?: string
    language?:  string
    tone?:      string
    jobTitle?:  string
    company?:   string
    cvId?:      string
  },
): Promise<CoverLetterRecord> {
  const cl = await (prisma as any).coverLetter.create({
    data: {
      userId,
      title:     data.title     || 'خطاب تقديم',
      content:   data.content,
      contentEn: data.contentEn || null,
      language:  data.language  || 'AR',
      tone:      data.tone      || 'professional',
      jobTitle:  data.jobTitle  || null,
      company:   data.company   || null,
      cvId:      data.cvId      || null,
    },
  })
  track({ name: 'cv.created', userId, data: { type: 'cover_letter', id: cl.id } })
  return cl
}

export async function updateCoverLetter(
  id:     string,
  userId: string,
  data: {
    title?:     string
    content?:   string
    contentEn?: string
    tone?:      string
    jobTitle?:  string
    company?:   string
  },
): Promise<CoverLetterRecord | null> {
  const existing = await (prisma as any).coverLetter.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return null
  return (prisma as any).coverLetter.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  })
}

export async function deleteCoverLetter(id: string, userId: string): Promise<boolean> {
  const existing = await (prisma as any).coverLetter.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return false
  await (prisma as any).coverLetter.delete({ where: { id } })
  track({ name: 'cv.deleted', userId, data: { type: 'cover_letter', id } })
  return true
}
