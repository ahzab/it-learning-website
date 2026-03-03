// lib/validation/schemas.ts
// Single source of truth for all Zod schemas.
// Imported by both frontend hooks AND backend API routes.

import { z } from 'zod'

// ── Field-level schemas (exported individually for inline validation) ──────────

export const emailField    = z.string().trim().email('validation.email.invalid')
export const passwordField = z
  .string()
  .min(8, 'validation.password.min')
  .max(128, 'validation.password.max')
  .regex(/[A-Za-z]/, 'validation.password.letter')
  .regex(/[0-9]/, 'validation.password.number')
export const nameField     = z.string().trim().min(2, 'validation.name.required').max(60, 'validation.name.max')
export const phoneField    = z
  .string()
  .transform(v => v.trim())
  .refine(v => v === '' || /^\+?[\d\s\-().]{7,20}$/.test(v), { message: 'validation.phone' })
export const urlField      = z
  .string()
  .transform(v => v.trim())
  .refine(v => v === '' || /^https?:\/\/.+\..+/.test(v), { message: 'validation.url' })
export const dateField     = z
  .string()
  .transform(v => v.trim())
  .refine(v => !v || /^(\d{4}(-\d{2})?|(\d{2}\/\d{4}))$/.test(v), { message: 'validation.date' })
export const gpaField      = z
  .string()
  .transform(v => v.trim())
  .refine(v => !v || /^(\d{1,2}(\.\d{1,2})?\s*\/\s*\d{1,2}(\.\d{1,2})?|\w[\w\s+\-]*)$/.test(v), { message: 'validation.gpa' })

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name:     nameField,
  email:    emailField,
  password: passwordField,
})

export const loginSchema = z.object({
  email:    z.string().trim().min(1, 'validation.required').email('validation.email.invalid'),
  password: z.string().min(1, 'validation.required'),
})

// ── CV Personal ───────────────────────────────────────────────────────────────

export const personalSchema = z.object({
  fullName:      z.string().trim().max(80).optional(),
  fullNameEn:    z.string().trim().max(80).optional(),
  jobTitle:      z.string().trim().max(100).optional(),
  jobTitleEn:    z.string().trim().max(100).optional(),
  email:         z.union([emailField, z.literal('')]).optional(),
  phone:         phoneField.optional(),
  location:      z.string().trim().max(100).optional(),
  locationEn:    z.string().trim().max(100).optional(),
  website:       urlField.optional(),
  linkedin:      urlField.optional(),
  summary:       z.string().max(800, 'validation.summary.max').optional(),
  summaryEn:     z.string().max(800, 'validation.summary.max').optional(),
  nationality:   z.string().max(60).optional(),
  maritalStatus: z.string().max(40).optional(),
  dateOfBirth:   z.string().optional(),
  visaStatus:    z.string().max(60).optional(),
})

// ── CV Experience ─────────────────────────────────────────────────────────────

export const experienceItemSchema = z.object({
  id:            z.string(),
  jobTitle:      z.string().trim().max(100).optional(),
  jobTitleEn:    z.string().trim().max(100).optional(),
  company:       z.string().trim().max(100).optional(),
  companyEn:     z.string().trim().max(100).optional(),
  location:      z.string().trim().max(100).optional(),
  startDate:     dateField.optional(),
  endDate:       dateField.optional(),
  isCurrent:     z.boolean().optional(),
  description:   z.string().max(800, 'validation.description.max').optional(),
  descriptionEn: z.string().max(800, 'validation.description.max').optional(),
  achievements:  z.array(z.string().max(300)).max(10).optional(),
}).refine(
  d => !!(d.jobTitle || d.jobTitleEn),
  { message: 'validation.jobTitle.required', path: ['jobTitle'] },
).refine(
  d => !!(d.company || d.companyEn),
  { message: 'validation.company.required', path: ['company'] },
)

export const experienceSchema = z.array(experienceItemSchema).max(15, 'validation.experience.max')

// ── CV Education ─────────────────────────────────────────────────────────────

export const educationItemSchema = z.object({
  id:           z.string(),
  degree:       z.string().trim().max(100).optional(),
  degreeEn:     z.string().trim().max(100).optional(),
  field:        z.string().trim().max(100).optional(),
  fieldEn:      z.string().trim().max(100).optional(),
  institution:  z.string().trim().max(120).optional(),
  institutionEn:z.string().trim().max(120).optional(),
  location:     z.string().trim().max(100).optional(),
  startDate:    dateField.optional(),
  endDate:      dateField.optional(),
  gpa:          gpaField.optional(),
  honors:       z.string().trim().max(100).optional(),
}).refine(
  d => !!(d.institution || d.institutionEn),
  { message: 'validation.institution.required', path: ['institution'] },
)

export const educationSchema = z.array(educationItemSchema).max(10, 'validation.education.max')

// ── Skills ────────────────────────────────────────────────────────────────────

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export const skillItemSchema = z.object({
  id:    z.string(),
  name:  z.string().trim().min(1, 'validation.required').max(60, 'validation.skill.max'),
  level: z.enum(SKILL_LEVELS).optional(),
})

export const skillsSchema = z.array(skillItemSchema).max(30, 'validation.skills.max')

// ── CV save ───────────────────────────────────────────────────────────────────

export const cvSaveSchema = z.object({
  title:    z.string().trim().min(1).max(120).optional(),
  template: z.string().optional(),
  language: z.string().optional(),
  country:  z.string().optional(),
  data:     z.record(z.unknown()),
})

// ── AI request ────────────────────────────────────────────────────────────────

const AI_ACTIONS = [
  'improve_summary', 'generate_summary', 'improve_experience',
  'suggest_skills',  'full_review',
  'translate_to_en', 'translate_to_ar',
] as const

export const aiRequestSchema = z.object({
  action:  z.enum(AI_ACTIONS, { message: 'validation.ai.action' }),
  context: z.record(z.unknown()),
})

// ── Generate ──────────────────────────────────────────────────────────────────

export const generateSchema = z.object({
  description: z
    .string()
    .trim()
    .min(20, 'validation.generate.min')
    .max(3000, 'validation.generate.max'),
  lang: z.enum(['ar', 'en', 'auto']).optional(),
})

// ── Tailor ────────────────────────────────────────────────────────────────────

export const tailorSchema = z.object({
  cv:             z.record(z.unknown()),
  jobDescription: z
    .string()
    .trim()
    .min(50, 'validation.tailor.min')
    .max(5000, 'validation.tailor.max'),
  jobTitle:  z.string().trim().max(100).optional(),
  company:   z.string().trim().max(100).optional(),
})

// ── Payment ───────────────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  plan: z.enum(['STARTER', 'PRO'], { message: 'validation.payment.plan' }),
})

// ── Type exports ──────────────────────────────────────────────────────────────

export type RegisterInput      = z.infer<typeof registerSchema>
export type LoginInput         = z.infer<typeof loginSchema>
export type PersonalInput      = z.infer<typeof personalSchema>
export type ExperienceInput    = z.infer<typeof experienceItemSchema>
export type EducationInput     = z.infer<typeof educationItemSchema>
export type SkillInput         = z.infer<typeof skillItemSchema>
export type CVSaveInput        = z.infer<typeof cvSaveSchema>
export type AIRequestInput     = z.infer<typeof aiRequestSchema>
export type GenerateInput      = z.infer<typeof generateSchema>
export type TailorInput        = z.infer<typeof tailorSchema>
export type CheckoutInput      = z.infer<typeof checkoutSchema>

// ── Intelligence ──────────────────────────────────────────────────────────────

export const intelligenceSchema = z.object({
  cv: z.record(z.unknown()).refine(
    v => Object.keys(v).length > 0,
    { message: 'validation.required' }
  ),
})

export type IntelligenceInput = z.infer<typeof intelligenceSchema>
