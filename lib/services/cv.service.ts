// lib/services/cv.service.ts
// All CV data-access operations.
// Web and mobile routes both call these — Prisma queries live here only.

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { logger } from '@/lib/utils/logger'

const log = logger('cv.service')

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CVSummary {
  id:        string
  title:     string
  template:  string
  language:  string
  country:   string
  updatedAt: Date
  createdAt: Date
}

export interface CVRecord extends CVSummary {
  data: Prisma.JsonValue
}

export interface CreateCVInput {
  userId:    string
  title?:    string
  data:      Prisma.InputJsonValue
  template?: string
  language?: string
  country?:  string
}

export interface UpdateCVInput {
  title?:    string
  data?:     Prisma.InputJsonValue
  template?: string
  language?: string
  country?:  string
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const CV_DEFAULTS = {
  title:    'سيرتي الذاتية',
  template: 'golden',
  language: 'AR',
  country:  'MA',
} as const

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * Return all CVs for a user, newest first.
 * Summary only (no data blob) to keep list payloads small.
 */
export async function listCVs(userId: string): Promise<CVSummary[]> {
  return prisma.cV.findMany({
    where:   { userId },
    orderBy: { updatedAt: 'desc' },
    select:  {
      id: true, title: true, template: true,
      language: true, country: true,
      updatedAt: true, createdAt: true,
    },
  })
}

// ── Get one ───────────────────────────────────────────────────────────────────

/**
 * Fetch a single CV, asserting ownership.
 * Returns null if not found or owned by a different user.
 */
export async function getCVById(id: string, userId: string): Promise<CVRecord | null> {
  return prisma.cV.findFirst({ where: { id, userId } }) as Promise<CVRecord | null>
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createCV(input: CreateCVInput): Promise<CVRecord> {
  return prisma.cV.create({
    data: {
      userId:   input.userId,
      title:    input.title    ?? CV_DEFAULTS.title,
      data:     input.data,
      template: input.template ?? CV_DEFAULTS.template,
      language: input.language ?? CV_DEFAULTS.language,
      country:  input.country  ?? CV_DEFAULTS.country,
    },
  }) as Promise<CVRecord>
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * Partial update — only the provided fields are changed.
 * Returns null if the CV doesn't exist or belongs to another user.
 */
export async function updateCV(
  id: string,
  userId: string,
  input: UpdateCVInput,
): Promise<CVRecord | null> {
  const existing = await prisma.cV.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return null

  return prisma.cV.update({
    where: { id },
    data: {
      ...(input.title    !== undefined && { title:    input.title }),
      ...(input.data     !== undefined && { data:     input.data }),
      ...(input.template !== undefined && { template: input.template }),
      ...(input.language !== undefined && { language: input.language }),
      ...(input.country  !== undefined && { country:  input.country }),
      updatedAt: new Date(),
    },
  }) as Promise<CVRecord>
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a CV. Returns false if not found or not owned.
 */
export async function deleteCV(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.cV.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return false
  await prisma.cV.delete({ where: { id } })
  return true
}
