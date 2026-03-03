// lib/services/cv.service.ts
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { logger } from '@/lib/utils/logger'
import { track } from '@/lib/observability'

const log = logger('cv.service')

export interface CVSummary {
  id: string; title: string; template: string
  language: string; country: string; updatedAt: Date; createdAt: Date
}
export interface CVRecord extends CVSummary { data: Prisma.JsonValue }
export interface CreateCVInput {
  userId: string; title?: string; data: Prisma.InputJsonValue
  template?: string; language?: string; country?: string
}
export interface UpdateCVInput {
  title?: string; data?: Prisma.InputJsonValue
  template?: string; language?: string; country?: string
}
export const CV_DEFAULTS = {
  title: 'سيرتي الذاتية', template: 'golden', language: 'AR', country: 'MA',
} as const

export async function listCVs(userId: string): Promise<CVSummary[]> {
  return prisma.cV.findMany({
    where:   { userId },
    orderBy: { updatedAt: 'desc' },
    select:  { id: true, title: true, template: true, language: true, country: true, updatedAt: true, createdAt: true },
  })
}

export async function getCVById(id: string, userId: string): Promise<CVRecord | null> {
  return prisma.cV.findFirst({ where: { id, userId } }) as Promise<CVRecord | null>
}

export async function createCV(input: CreateCVInput): Promise<CVRecord> {
  const cv = await prisma.cV.create({
    data: {
      userId:   input.userId,
      title:    input.title    ?? CV_DEFAULTS.title,
      data:     input.data,
      template: input.template ?? CV_DEFAULTS.template,
      language: input.language ?? CV_DEFAULTS.language,
      country:  input.country  ?? CV_DEFAULTS.country,
    },
  }) as CVRecord

  track({ name: 'cv.created', userId: input.userId,
    data: { cvId: cv.id, template: cv.template, language: cv.language, country: cv.country } })
  return cv
}

export async function updateCV(
  id: string, userId: string, input: UpdateCVInput,
): Promise<CVRecord | null> {
  const existing = await prisma.cV.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return null

  const cv = await prisma.cV.update({
    where: { id },
    data: {
      ...(input.title    !== undefined && { title:    input.title }),
      ...(input.data     !== undefined && { data:     input.data }),
      ...(input.template !== undefined && { template: input.template }),
      ...(input.language !== undefined && { language: input.language }),
      ...(input.country  !== undefined && { country:  input.country }),
      updatedAt: new Date(),
    },
  }) as CVRecord

  track({ name: 'cv.updated', userId,
    data: { cvId: id, fields: Object.keys(input).join(',') } })
  return cv
}

export async function deleteCV(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.cV.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return false
  await prisma.cV.delete({ where: { id } })

  track({ name: 'cv.deleted', userId, data: { cvId: id } })
  return true
}
