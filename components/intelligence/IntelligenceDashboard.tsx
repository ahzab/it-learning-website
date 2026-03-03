'use client'
// components/intelligence/IntelligenceDashboard.tsx
// The Career Intelligence Dashboard — MENA market analysis powered by AI.
// Design: Bloomberg Terminal meets Arabic newspaper — obsidian/navy with
// amber data accents. Monospace numbers, animated reveals, pulsing health ring.

import { useState, useEffect, useRef } from 'react'
import { useT } from '@/lib/i18n/context'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SalaryCountry {
  code: string; name: string; nameEn: string
  min: number; max: number; currency: string; symbol: string
  demand: 'very_high' | 'high' | 'medium' | 'low'
}

interface SkillGap {
  skill: string; urgency: 'critical' | 'important' | 'nice_to_have'
  demandPct: number; reason: string; reasonEn: string
  learningTime: string; learningTimeEn: string; freeResource?: string
}

interface Strength {
  skill: string; demandPct: number; label: string; labelEn: string; color: string
}

interface MarketPulse {
  sector: string; sectorEn: string; country: string
  countryName: string; countryNameEn: string
  momentum: 'accelerating' | 'stable' | 'slowing'
  growthPct: number; jobCount: string; matchScore: number
  topCompanies: string[]; insight: string; insightEn: string; flag: string
}

interface ActionItem {
  priority: number; action: string; actionEn: string
  impact: 'high' | 'medium' | 'low'
  timeframe: string; timeframeEn: string; icon: string
}

interface Intelligence {
  healthScore: number; healthLabel: string; healthLabelEn: string
  healthSummary: string; healthSummaryEn: string
  salaryIntel: {
    currency: string; currencySymbol: string
    min: number; mid: number; max: number; userEstimate: number
    marketLabel: string; marketLabelEn: string
    byCountry: SalaryCountry[]
    insight: string; insightEn: string
  }
  skillGaps: SkillGap[]
  strengths: Strength[]
  marketPulse: MarketPulse[]
  actionPlan: ActionItem[]
  generatedAt: string
  profileCompleteness: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  critical:     { ar: 'ضروري',   en: 'Critical',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'  },
  important:    { ar: 'مهم',     en: 'Important',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' },
  nice_to_have: { ar: 'مفيد',   en: 'Nice to have', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' },
}

const MOMENTUM_CONFIG = {
  accelerating: { ar: 'متسارع النمو', en: 'Accelerating', color: '#22C55E', icon: '↗' },
  stable:       { ar: 'مستقر',        en: 'Stable',       color: '#C9A84C', icon: '→' },
  slowing:      { ar: 'تباطؤ',        en: 'Slowing',      color: '#6B7280', icon: '↘' },
}

const DEMAND_COLORS = {
  very_high: '#22C55E', high: '#C9A84C', medium: '#6B7280', low: '#374151'
}

function fmt(n: number) { return n.toLocaleString() }

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthRing({ score, label, labelEn, summary, summaryEn, isAr }: {
  score: number; label: string; labelEn: string
  summary: string; summaryEn: string; isAr: boolean
}) {
  const { t, isRTL } = useT()
  const b = t.builder
  const [displayed, setDisplayed] = useState(0)
  const r = 56, circ = 2 * Math.PI * r
  const dash = (displayed / 100) * circ
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#C9A84C' : score >= 40 ? '#F59E0B' : '#EF4444'
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D'

  useEffect(() => {
    let frame = 0
    const total = 60
    const timer = setInterval(() => {
      frame++
      setDisplayed(Math.min(score, Math.round((frame / total) * score)))
      if (frame >= total) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [score])

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8">
      {/* Ring */}
      <div className="relative flex-shrink-0">
        <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle cx="74" cy="74" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          {/* Glow ring */}
          <circle cx="74" cy="74" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}66)`, transition: 'stroke-dasharray 0.05s linear' }} />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(0deg)' }}>
          <div className="font-mono font-black text-4xl leading-none" style={{ color }}>{displayed}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-mono">/100</div>
          <div className="text-base font-black mt-1 px-2 py-0.5 rounded-md" style={{ background: color + '20', color }}>{grade}</div>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full animate-ping opacity-10"
          style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-gray-600 mb-1">
          {b.intelCareerHealth}
        </div>
        <div className="text-2xl font-black mb-2" style={{ color }}>
          {isAr ? label : labelEn}
        </div>
        <p className="text-sm text-gray-400 leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
          {isAr ? summary : summaryEn}
        </p>
      </div>
    </div>
  )
}

function SalaryPanel({ data, isAr }: { data: Intelligence['salaryIntel'], isAr: boolean }) {
  const { t, isRTL } = useT()
  const b = t.builder
  const [hovered, setHovered] = useState<string | null>(null)
  const maxVal = Math.max(...data.byCountry.map(c => c.max))

  return (
    <div className="space-y-5">
      {/* Range visualization */}
      <div>
        <div className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-3">
          {isAr ? data.marketLabel : data.marketLabelEn}
        </div>
        <div className="relative h-10 bg-white/4 rounded-xl overflow-hidden">
          {/* Min-Max range bar */}
          <div className="absolute top-0 bottom-0 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/30"
            style={{ left: `${(data.min / data.max) * 60}%`, right: '10%' }} />
          {/* Your estimate marker */}
          <div className="absolute top-1 bottom-1 w-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_#C9A84C]"
            style={{ left: `${((data.userEstimate - data.min) / (data.max - data.min)) * 80 + 5}%` }}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-amber-400 font-mono whitespace-nowrap">
              {b.intelYou}
            </div>
          </div>
          {/* Labels */}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <span className="text-xs font-mono text-gray-500">{fmt(data.min)} {data.currencySymbol}</span>
            <span className="text-sm font-black font-mono text-amber-300">{fmt(data.mid)} {data.currencySymbol}</span>
            <span className="text-xs font-mono text-gray-500">{fmt(data.max)} {data.currencySymbol}</span>
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-gray-700 mt-1 px-1">
          <span>{b.intelMin}</span>
          <span>{b.intelMedian}</span>
          <span>{b.intelMax}</span>
        </div>
      </div>

      {/* By country */}
      <div className="space-y-2">
        {data.byCountry.map(c => {
          const barW = (c.max / maxVal) * 100
          const isHov = hovered === c.code
          return (
            <div key={c.code}
              className="group cursor-pointer"
              onMouseEnter={() => setHovered(c.code)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 text-xs font-mono text-gray-600 flex-shrink-0">{c.code}</div>
                <div className="flex-1 h-7 bg-white/3 rounded-lg overflow-hidden relative">
                  <div className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${barW}%`,
                      background: `linear-gradient(90deg, ${DEMAND_COLORS[c.demand]}30, ${DEMAND_COLORS[c.demand]}60)`,
                      borderRight: `2px solid ${DEMAND_COLORS[c.demand]}80`,
                    }} />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-xs font-bold text-white/80">{isAr ? c.name : c.nameEn}</span>
                    <span className="text-xs font-mono text-gray-400">
                      {fmt(c.min)}–{fmt(c.max)} {c.symbol}
                    </span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: DEMAND_COLORS[c.demand], boxShadow: `0 0 6px ${DEMAND_COLORS[c.demand]}` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Insight */}
      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
        <p className="text-xs text-amber-300/80 leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
          💡 {isAr ? data.insight : data.insightEn}
        </p>
      </div>
    </div>
  )
}

function SkillGapsPanel({ gaps, strengths, isAr }: {
  gaps: SkillGap[]; strengths: Strength[]; isAr: boolean
}) {
  const { t, isRTL } = useT()
  const b = t.builder
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2">
            {b.intelYourSkills}
          </div>
          <div className="flex flex-wrap gap-2">
            {strengths.map(s => (
              <div key={s.skill}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold"
                style={{ background: s.color + '12', borderColor: s.color + '30', color: s.color }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                {s.skill}
                <span className="font-mono opacity-70">{s.demandPct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2">
          {b.intelSkillGaps}
        </div>
        <div className="space-y-2">
          {gaps.map(g => {
            const cfg = URGENCY_CONFIG[g.urgency]
            const isOpen = expanded === g.skill
            return (
              <div key={g.skill}
                className="rounded-xl border overflow-hidden transition-all cursor-pointer"
                style={{ background: cfg.bg, borderColor: cfg.border }}
                onClick={() => setExpanded(isOpen ? null : g.skill)}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Demand bar */}
                  <div className="w-8 flex-shrink-0 text-center">
                    <div className="text-xs font-mono font-black" style={{ color: cfg.color }}>{g.demandPct}%</div>
                    <div className="h-0.5 bg-white/10 rounded mt-0.5">
                      <div className="h-full rounded transition-all" style={{ width: `${g.demandPct}%`, background: cfg.color }} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{g.skill}</span>
                      <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold"
                        style={{ background: cfg.color + '20', color: cfg.color }}>
                        {isAr ? cfg.ar : cfg.en}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5" dir={isRTL ? 'rtl' : 'ltr'}>
                      {isAr ? g.reason : g.reasonEn}
                    </div>
                  </div>

                  <div className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ fontSize: 10 }}>▾</div>
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-500">⏱ {isAr ? g.learningTime : g.learningTimeEn}</span>
                    </div>
                    {g.freeResource && (
                      <a href={g.freeResource} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                        onClick={e => e.stopPropagation()}>
                        {b.intelFreeResource} →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MarketPulsePanel({ data, isAr }: { data: MarketPulse[], isAr: boolean }) {
  const { t, isRTL } = useT()
  const b = t.builder
  const [selected, setSelected] = useState(0)
  const item = data[selected]
  if (!item) return null
  const mom = MOMENTUM_CONFIG[item.momentum]

  return (
    <div className="space-y-4">
      {/* Sector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.map((m, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              selected === i
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-300'
            }`}>
            <span>{m.flag}</span>
            {isAr ? m.sector : m.sectorEn}
          </button>
        ))}
      </div>

      {/* Detail card */}
      <div className="bg-white/3 rounded-2xl border border-white/8 p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-black text-white">
              {item.flag} {isAr ? item.sector : item.sectorEn}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {isAr ? item.countryName : item.countryNameEn}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: mom.color }}>
              {mom.icon} {isAr ? mom.ar : mom.en}
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: mom.color }}>+{item.growthPct}%</div>
            <div className="text-[10px] text-gray-600">{b.intelAnnualGrowth}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: b.intelOpenJobs, value: item.jobCount },
            { label: b.intelProfileMatch, value: `${item.matchScore}%` },
            { label: b.intelTopEmployer, value: item.topCompanies[0] || '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/4 rounded-xl p-2.5 text-center">
              <div className="text-base font-black font-mono text-amber-300">{stat.value}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Top companies */}
        <div className="flex flex-wrap gap-1.5">
          {item.topCompanies.map(c => (
            <span key={c} className="text-[10px] px-2 py-1 bg-white/5 border border-white/8 rounded-lg text-gray-400">
              {c}
            </span>
          ))}
        </div>

        {/* Insight */}
        <p className="text-xs text-gray-400 leading-relaxed bg-amber-500/5 border border-amber-500/12 rounded-xl p-3"
          dir={isRTL ? 'rtl' : 'ltr'}>
          💡 {isAr ? item.insight : item.insightEn}
        </p>
      </div>
    </div>
  )
}

function ActionPlan({ items, isAr }: { items: ActionItem[]; isAr: boolean }) {
  const { t, isRTL } = useT()
  const b = t.builder
  const [done, setDone] = useState<number[]>([])
  const IMPACT = { high: '#22C55E', medium: '#C9A84C', low: '#6B7280' }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isDone = done.includes(i)
        return (
          <div key={i}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
              isDone ? 'opacity-40 border-white/5 bg-white/2' : 'border-white/10 bg-white/3 hover:border-white/15'
            }`}>
            {/* Checkbox */}
            <button
              onClick={() => setDone(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                isDone ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-amber-400'
              }`}>
              {isDone && <span className="text-white text-xs">✓</span>}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{item.icon}</span>
                <span className={`text-sm font-bold ${isDone ? 'line-through text-gray-600' : 'text-white'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}>
                  {isAr ? item.action : item.actionEn}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-600">
                  ⏱ {isAr ? item.timeframe : item.timeframeEn}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: IMPACT[item.impact] }}>
                  {item.impact === 'high' ? (b.intelHighImpact)
                    : item.impact === 'medium' ? (b.intelMedium)
                    : (b.intelLow)}
                </span>
              </div>
            </div>

            {/* Priority badge */}
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 border"
              style={{ borderColor: '#C9A84C40', color: '#C9A84C', background: '#C9A84C12' }}>
              {item.priority}
            </div>
          </div>
        )
      })}

      {done.length > 0 && (
        <p className="text-xs text-emerald-500 text-center font-mono">
          ✓ {done.length}/{items.length} {b.intelCompleted}
        </p>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PulsingCard({ h = 'h-40' }: { h?: string }) {
  return (
    <div className={`${h} rounded-2xl bg-white/3 border border-white/6 overflow-hidden relative`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/4 to-transparent animate-[shimmer_2s_infinite]"
        style={{ backgroundSize: '200% 100%' }} />
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

interface Props {
  cvData: any
  cvTitle?: string
  isAr?: boolean
}

export function IntelligenceDashboard({ cvData, cvTitle, isAr = true }: Props) {
  const { t, isRTL, locale } = useT()
  const b = t.builder
  const [intel, setIntel] = useState<Intelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const lastFetchRef = useRef<string>('')
  const analyze = async (isRefresh = false) => {
    if (loading) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cvData }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setIntel(data)
      lastFetchRef.current = new Date().toISOString()
    } catch {
      setError(b.intelAnalysisFailed)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (cvData?.personal?.jobTitle || cvData?.personal?.jobTitleEn) {
      analyze()
    }
  }, [])

  const hasProfile = cvData?.personal?.jobTitle || cvData?.personal?.jobTitleEn

  // ── Empty state ──────────────────────────────────────────────────
  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-[#070710] flex items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-sm sm:max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl mx-auto mb-6">
            📊
          </div>
          <h2 className="text-2xl font-black mb-3 text-white">
            {b.intelCompleteCV}
          </h2>
          <p className="text-gray-400 text-sm mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {b.intelCompleteCVDesc}
          </p>
          <a href="/builder"
            className="inline-flex items-center gap-2 bg-amber-500 text-black font-black px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors">
            {b.intelCompleteCVBtn}
          </a>
        </div>
      </div>
    )
  }

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070710] p-4 sm:p-6">
        {/* Header skeleton */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-32 bg-white/4 rounded animate-pulse" />
            </div>
          </div>

          {/* Analyzing animation */}
          <div className="bg-white/3 border border-amber-500/15 rounded-2xl p-5 sm:p-8 mb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="w-full h-full rounded-full border-2 border-amber-500/20 animate-spin"
                style={{ borderTopColor: '#C9A84C' }} />
              <div className="absolute inset-2 rounded-full border border-amber-500/10 animate-ping" />
            </div>
            <div className="text-amber-400 font-bold text-lg mb-2">
              {b.intelAnalyzing}
            </div>
            <div className="text-gray-500 text-sm">
              {b.intelTakes}
            </div>
            {/* Animated dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[b.intelCareerHealthTab, b.intelSalaryBenchmarks, b.intelSkillsRadar, b.intelMarketPulse].map((s, i) => (
                <div key={s} className="text-xs text-gray-600 flex items-center gap-1"
                  style={{ animationDelay: `${i * 0.5}s` }}>
                  <div className="w-1 h-1 bg-amber-500/40 rounded-full animate-pulse" />
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PulsingCard h="h-52" />
            <PulsingCard h="h-52" />
            <PulsingCard h="h-64" />
            <PulsingCard h="h-64" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#070710] flex items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-sm sm:max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => analyze()}
            className="bg-amber-500 text-black font-black px-6 py-3 rounded-xl hover:bg-amber-400">
            {b.intelRetry}
          </button>
        </div>
      </div>
    )
  }

  if (!intel) return null

  const name = cvData?.personal?.fullName || cvData?.personal?.fullNameEn || ''
  const title = cvData?.personal?.jobTitle || cvData?.personal?.jobTitleEn || ''
  const generatedTime = intel.generatedAt
    ? new Date(intel.generatedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="min-h-screen bg-[#070710]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-3"
          style={{ background: 'radial-gradient(circle, #22C55E 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto p-4 sm:p-5 md:p-8 pb-20 sm:pb-16">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-gray-600">
                  {b.intelTitle}
                </div>
                <h1 className="text-xl font-black text-white">
                  {name || cvTitle || (b.intelMyProfile)}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-gray-600">
              <span>💼 {title}</span>
              {generatedTime && <span>· {b.intelAnalyzed} {generatedTime}</span>}
              <span className="flex items-center gap-1">
                · {b.intelProfile} <span className="text-amber-400 font-bold">{intel.profileCompleteness}%</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => analyze(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400 transition-all text-sm disabled:opacity-40 flex-shrink-0"
          >
            <span className={refreshing ? 'animate-spin' : ''}>↺</span>
            {b.intelRefresh}
          </button>
        </div>

        {/* ── Row 1: Health + Salary ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Health Score */}
          <div className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-white/12 transition-all">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-5 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-amber-400 inline-block" />
              {b.intelCareerHealthTab}
            </div>
            <HealthRing
              score={intel.healthScore}
              label={intel.healthLabel}
              labelEn={intel.healthLabelEn}
              summary={intel.healthSummary}
              summaryEn={intel.healthSummaryEn}
              isAr={isAr}
            />
          </div>

          {/* Salary Intelligence */}
          <div className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-white/12 transition-all">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-5 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-emerald-400 inline-block" />
              {b.intelSalaryBenchmarks}
            </div>
            <SalaryPanel data={intel.salaryIntel} isAr={isAr} />
          </div>
        </div>

        {/* ── Row 2: Skill Gaps + Market Pulse ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Skill Gaps */}
          <div className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-white/12 transition-all">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-5 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-red-400 inline-block" />
              {b.intelSkillsRadar}
            </div>
            <SkillGapsPanel gaps={intel.skillGaps} strengths={intel.strengths} isAr={isAr} />
          </div>

          {/* Market Pulse */}
          <div className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-white/12 transition-all">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-5 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-blue-400 inline-block" />
              {b.intelMarketPulse}
            </div>
            <MarketPulsePanel data={intel.marketPulse} isAr={isAr} />
          </div>
        </div>

        {/* ── Row 3: Action Plan (full width) ─────────────────── */}
        <div className="bg-[#0D0D1A] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-white/12 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 mb-5 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-purple-400 inline-block" />
            {b.intelActionPlan}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionPlan items={intel.actionPlan} isAr={isAr} />
          </div>
        </div>

        {/* ── Footer nav ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-center mt-6 sm:mt-8">
          <a href="/builder"
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 text-sm font-bold hover:bg-amber-500/25 transition-all">
            ✎ {b.intelImproveCV}
          </a>
          <a href="/tailor"
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all">
            🎯 {b.intelTailorJob}
          </a>
          <a href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:border-white/20 transition-all">
            ← {b.intelMyCVs}
          </a>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-gray-700 mt-6 font-mono">
          {b.intelDisclaimer}
        </p>
      </div>

    </div>
  )
}
