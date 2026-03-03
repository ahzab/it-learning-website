// lib/plans.ts
// Single source of truth for all plan limits, feature gates, and AI cost logic.
// Every route and UI component imports from here — never hardcode plan logic.
//
// Cost estimates (Gemini API, approximate):
//   callClaudeStream (Flash)  ≈ $0.001–0.003 per call  → "1 credit"
//   callClaudeJSON  (Pro)     ≈ $0.010–0.030 per call  → "3 credits" (generate/tailor/intel)
//
// Revenue math:
//   FREE    → 0 revenue, costs ~$0.003–0.009 per user lifetime (3 stream credits)
//   STARTER → $4.99 revenue, costs ~$0.04–0.09 per user lifetime (20 stream equiv credits)
//   PRO     → $12/month, costs ~$0.50–3.00/month (heavy users, unlimited)
//   Target gross margin: >70% on STARTER, >60% on PRO

export type PlanId = 'FREE' | 'STARTER' | 'PRO'

// ── Credit costs per AI operation ────────────────────────────────────────────
// "1 credit" is the base unit — cheap Flash streaming call
export const AI_CREDIT_COSTS = {
  // Light operations (Flash model, streaming)
  improve_summary:     1,
  generate_summary:    1,
  improve_experience:  1,
  improve_skills:      1,
  suggest_skills:      1,
  full_review:         1,
  // Heavy operations (Pro model, structured JSON)
  generate_cv:         3,   // Full CV generation from description
  tailor_cv:           3,   // CV tailoring for specific job
  intelligence:        5,   // Career intelligence analysis (most expensive)
  generate_cover_letter: 2,  // Cover letter generation (Pro model, lighter than full CV)
  improve_cover_letter:  1,  // Improve/rewrite section (Flash model)
} as const

export type AIOperation = keyof typeof AI_CREDIT_COSTS

// ── Plan definitions ─────────────────────────────────────────────────────────
export interface PlanDefinition {
  id:              PlanId
  name:            string
  nameAr:          string
  nameFr:          string
  price:           number     // USD cents (0 = free)
  priceDisplay:    string
  billingPeriod:   'free' | 'one-time' | 'monthly'
  aiCredits:       number     // -1 = unlimited
  maxCVs:          number     // -1 = unlimited
  maxTemplates:    number     // -1 = all
  pdfExport:       boolean
  pdfWatermark:    boolean    // FREE plan gets watermark
  intelligence:    boolean    // Career Intelligence Dashboard
  tailoring:       boolean    // Job tailoring feature
  coverLetter:     boolean    // Cover letter builder
  linkedinImport:  boolean
  priorityAI:      boolean    // Queue priority for AI calls
  stripeMode:      'payment' | 'subscription' | null
}

export const PLAN_DEFS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id:             'FREE',
    name:           'Free',
    nameAr:         'مجاني',
    nameFr:         'Gratuit',
    price:          0,
    priceDisplay:   '$0',
    billingPeriod:  'free',
    aiCredits:      3,         // 3 streaming credits — enough for 1 good session
    maxCVs:         1,
    maxTemplates:   2,         // Golden + Minimal only
    pdfExport:      true,      // Yes but watermarked
    pdfWatermark:   true,
    intelligence:   false,
    tailoring:      false,
    coverLetter:    false,
    linkedinImport: false,
    priorityAI:     false,
    stripeMode:     null,
  },

  STARTER: {
    id:             'STARTER',
    name:           'Starter',
    nameAr:         'المبتدئ',
    nameFr:         'Starter',
    price:          499,       // $4.99 one-time
    priceDisplay:   '$4.99',
    billingPeriod:  'one-time',
    aiCredits:      20,        // ~6-7 heavy ops or 20 light ops
    maxCVs:         3,
    maxTemplates:   -1,        // All 5 templates
    pdfExport:      true,
    pdfWatermark:   false,
    intelligence:   false,     // Intelligence is PRO only
    tailoring:      true,      // 1 tailor uses 3 credits → ~6 tailors max
    coverLetter:    true,      // Cover letters available on STARTER
    linkedinImport: true,
    priorityAI:     false,
    stripeMode:     'payment',
  },

  PRO: {
    id:             'PRO',
    name:           'Pro',
    nameAr:         'الاحترافي',
    nameFr:         'Pro',
    price:          1200,      // $12/month
    priceDisplay:   '$12',
    billingPeriod:  'monthly',
    aiCredits:      -1,        // Unlimited
    maxCVs:         -1,
    maxTemplates:   -1,
    pdfExport:      true,
    pdfWatermark:   false,
    intelligence:   true,
    tailoring:      true,
    coverLetter:    true,
    linkedinImport: true,
    priorityAI:     true,
    stripeMode:     'subscription',
  },
}

// ── Helper functions ─────────────────────────────────────────────────────────

/** Check if a user on a given plan can use a specific AI operation */
export function canUseAI(
  plan: PlanId,
  operation: AIOperation,
  currentCreditsUsed: number,
): { allowed: boolean; reason?: string; creditsNeeded: number } {
  const def  = PLAN_DEFS[plan]
  const cost = AI_CREDIT_COSTS[operation]

  // Unlimited plan
  if (def.aiCredits === -1) return { allowed: true, creditsNeeded: cost }

  // Feature-level gate (e.g. intelligence, tailoring)
  if (operation === 'intelligence' && !def.intelligence) {
    return { allowed: false, reason: 'PLAN_REQUIRED', creditsNeeded: cost }
  }
  if (operation === 'tailor_cv' && !def.tailoring) {
    return { allowed: false, reason: 'PLAN_REQUIRED', creditsNeeded: cost }
  }
  if ((operation === 'generate_cover_letter' || operation === 'improve_cover_letter') && !(def as any).coverLetter) {
    return { allowed: false, reason: 'PLAN_REQUIRED', creditsNeeded: cost }
  }

  // Credit gate
  const remaining = def.aiCredits - currentCreditsUsed
  if (remaining < cost) {
    return { allowed: false, reason: 'NO_CREDITS', creditsNeeded: cost }
  }

  return { allowed: true, creditsNeeded: cost }
}

/** Check if a user can create another CV */
export function canCreateCV(plan: PlanId, currentCVCount: number): boolean {
  const def = PLAN_DEFS[plan]
  return def.maxCVs === -1 || currentCVCount < def.maxCVs
}

/** Check if a user can access a specific template */
export const FREE_TEMPLATES = ['golden', 'minimal'] as const
export function canUseTemplate(plan: PlanId, templateId: string): boolean {
  const def = PLAN_DEFS[plan]
  if (def.maxTemplates === -1) return true
  return (FREE_TEMPLATES as readonly string[]).includes(templateId)
}

/** Get remaining AI credits for display */
export function getRemainingCredits(plan: PlanId, used: number): number | '∞' {
  const def = PLAN_DEFS[plan]
  if (def.aiCredits === -1) return '∞'
  return Math.max(0, def.aiCredits - used)
}

/** Map old plan names to new ones for backwards compatibility */
export function normalizePlan(raw: string): PlanId {
  const map: Record<string, PlanId> = {
    FREE:    'FREE',
    BASIC:   'STARTER',  // Migration: old BASIC → new STARTER
    PRO:     'PRO',
    STARTER: 'STARTER',
  }
  return map[raw] ?? 'FREE'
}

// ── Stripe plan metadata ─────────────────────────────────────────────────────
export const STRIPE_PLANS = {
  STARTER: {
    priceId: process.env.STRIPE_PRICE_STARTER ?? process.env.STRIPE_PRICE_BASIC!,
    mode:    'payment' as const,
  },
  PRO: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    mode:    'subscription' as const,
  },
}
