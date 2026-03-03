'use client'
// components/builder/AICreditsBadge.tsx
// Shows remaining AI credits in the builder header.
// Fetches from /api/me or gets from session — lightweight.

import { useSession } from 'next-auth/react'
import { useT } from '@/lib/i18n/context'
import { PLAN_DEFS, normalizePlan, getRemainingCredits } from '@/lib/plans'
import { useState, useEffect } from 'react'

export function AICreditsBadge() {
  const { data: session } = useSession()
  const { t } = useT()
  const b = t.builder

  const [creditsUsed, setCreditsUsed] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    // Fetch current usage from API
    fetch('/api/me/credits')
      .then(r => r.json())
      .then(d => {
        setCreditsUsed(d.creditsUsed ?? 0)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [session])

  if (!session?.user || !loaded) return null

  const plan      = normalizePlan((session.user as any).plan ?? 'FREE')
  const def       = PLAN_DEFS[plan]
  const remaining = getRemainingCredits(plan, creditsUsed)

  if (remaining === '∞') {
    return (
      <span className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-purple-500/25 bg-purple-500/8 text-purple-400 font-bold flex-shrink-0">
        ✦ {b.creditsUnlimited}
      </span>
    )
  }

  const pct    = remaining / def.aiCredits
  const color  = pct > 0.4 ? 'emerald' : pct > 0.15 ? 'amber' : 'red'
  const colors = {
    emerald: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400',
    amber:   'border-amber-500/35 bg-amber-500/10 text-amber-400',
    red:     'border-red-500/35 bg-red-500/10 text-red-400 animate-pulse',
  }

  if (remaining === 0) {
    return (
      <a href="/api/payment/checkout?plan=STARTER"
        className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold hover:bg-amber-500/20 transition-all flex-shrink-0">
        {b.creditsExhausted} — {b.upgradeBtn} →
      </a>
    )
  }

  return (
    <span className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold flex-shrink-0 ${colors[color]}`}>
      ✦ {b.creditsRemaining?.replace('{n}', String(remaining)) ?? `${remaining} credits`}
    </span>
  )
}
