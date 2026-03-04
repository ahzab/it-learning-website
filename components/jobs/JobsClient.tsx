'use client'
// components/jobs/JobsClient.tsx
// Arabic Job Board — full aggregator + AI match scoring UI.
// Aesthetic: Bloomberg terminal meets Gulf executive portal.
// Dark-teal intelligence palette — electric cyan data accents,
// midnight navy cards, gold match badges. Dense but breathable.

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useT } from '@/lib/i18n/context'
import { useCVStore } from '@/lib/store'
import type {
  JobPosting, JobSearchParams, JobSearchResult,
  JobMatchResult, JobCountry, JobSource,
  JobType,
} from '@/types/jobs'
import { MENA_SECTORS, COUNTRY_META } from '@/types/jobs'

// ── Source metadata ───────────────────────────────────────────────────────────

const SOURCE_META: Record<JobSource, { label: string; color: string; icon: string }> = {
  bayt:       { label: 'Bayt.com',      color: '#00A8E8', icon: '🌐' },
  wuzzuf:     { label: 'Wuzzuf',        color: '#FF6B35', icon: '🇪🇬' },
  naukrigulf: { label: 'NaukriGulf',    color: '#4CAF50', icon: '🌴' },
  tanqeeb:    { label: 'Tanqeeb',       color: '#8B5CF6', icon: '⚡' },
  akhtaboot:  { label: 'Akhtaboot',     color: '#F59E0B', icon: '🇯🇴' },
  forasna:    { label: 'Forasna',       color: '#10B981', icon: '🇲🇦' },
  rekrut:     { label: 'Rekrut',        color: '#06B6D4', icon: '💼' },
  emploi:     { label: 'EmploiMaroc',   color: '#EC4899', icon: '📋' },
  linkedin:   { label: 'LinkedIn',      color: '#0077B5', icon: '🔗' },
}

const JOB_TYPE_LABELS: Record<JobType, { ar: string; en: string; color: string }> = {
  full_time:  { ar: 'دوام كامل',  en: 'Full-time',  color: '#10B981' },
  part_time:  { ar: 'دوام جزئي', en: 'Part-time',  color: '#F59E0B' },
  contract:   { ar: 'عقد',        en: 'Contract',   color: '#8B5CF6' },
  remote:     { ar: 'عن بُعد',   en: 'Remote',     color: '#06B6D4' },
  hybrid:     { ar: 'هجين',      en: 'Hybrid',     color: '#3B82F6' },
  internship: { ar: 'تدريب',     en: 'Internship', color: '#EC4899' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MatchRing({ score, size = 48 }: { score: number; size?: number }) {
  const r    = size * 0.38
  const circ = 2 * Math.PI * r
  const dash = circ - (score / 100) * circ
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#C9A84C' : '#6B7280'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.1} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{ color, fontSize: size * 0.22 }}>{score}%</span>
      </div>
    </div>
  )
}

function SkillPill({ name, matched }: { name: string; matched?: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
      matched
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
        : 'bg-white/4 text-gray-500 border border-white/8'
    }`}>
      {name}
    </span>
  )
}

function JobTypeBadge({ type, isAr }: { type: JobType; isAr: boolean }) {
  const meta = JOB_TYPE_LABELS[type]
  return (
    <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{
      background: meta.color + '18',
      color:      meta.color,
      border:     `1px solid ${meta.color}28`,
    }}>
      {isAr ? meta.ar : meta.en}
    </span>
  )
}

function SourceBadge({ source }: { source: JobSource }) {
  const meta = SOURCE_META[source]
  return (
    <span className="text-xs flex items-center gap-1 text-gray-600">
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  )
}

function TimeAgo({ date, isAr }: { date: Date | string; isAr: boolean }) {
  const d    = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  let label: string
  if (isAr) {
    if (days > 6)  label = `${d.getDate()} ${d.toLocaleString('ar', { month: 'short' })}`
    else if (days > 0) label = `منذ ${days === 1 ? 'يوم' : `${days} أيام`}`
    else if (hrs  > 0) label = `منذ ${hrs} ساعة`
    else               label = `منذ ${mins} دقيقة`
  } else {
    if (days > 6)  label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    else if (days > 0) label = `${days}d ago`
    else if (hrs  > 0) label = `${hrs}h ago`
    else               label = `${mins}m ago`
  }
  return <span className="text-xs text-gray-600">{label}</span>
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({
  job, isAr, cvSkills, savedIds, matchResult, onSave, onMatch, onOpen,
}: {
  job:         JobPosting
  isAr:        boolean
  cvSkills:    Set<string>
  savedIds:    Set<string>
  matchResult?: JobMatchResult
  onSave:      (job: JobPosting) => void
  onMatch:     (job: JobPosting) => void
  onOpen:      (job: JobPosting) => void
}) {
  const isSaved  = savedIds.has(job.id)
  const title    = isAr && job.titleAr ? job.titleAr : (job.titleEn || job.title)
  const location = isAr && job.locationAr ? job.locationAr : job.location
  const countryMeta = COUNTRY_META[job.country]
  const matchColor  = matchResult
    ? matchResult.score >= 75 ? '#10B981' : matchResult.score >= 50 ? '#C9A84C' : '#6B7280'
    : undefined

  return (
    <article
      className="group bg-[#0D1117] border border-white/6 rounded-2xl overflow-hidden hover:border-cyan-500/20 hover:shadow-[0_0_32px_rgba(6,182,212,0.06)] transition-all cursor-pointer"
      onClick={() => onOpen(job)}
    >
      {/* Urgency stripe */}
      {job.isUrgent && (
        <div className="h-0.5 bg-gradient-to-r from-amber-500 to-red-500" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Company logo placeholder */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/6 to-white/3 border border-white/8 flex items-center justify-center text-base flex-shrink-0 font-black text-gray-400">
            {job.company[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors">
                {title}
              </h3>
              {matchResult && (
                <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <MatchRing score={matchResult.score} size={40} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-400 font-semibold">{job.company}</span>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                {countryMeta?.flag} {location}
              </span>
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <JobTypeBadge type={job.jobType} isAr={isAr} />
          {job.isRemote && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              🌐 {isAr ? 'عن بُعد' : 'Remote'}
            </span>
          )}
          {job.isUrgent && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              ⚡ {isAr ? 'عاجل' : 'Urgent'}
            </span>
          )}
          {job.salaryDisplay && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              💰 {job.salaryDisplay}
            </span>
          )}
        </div>

        {/* Skills */}
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.skills.slice(0, 6).map(skill => (
              <span key={skill}><SkillPill
                name={skill}
                matched={!!cvSkills.has(skill.toLowerCase())}
              /></span>
            ))}
            {job.skills.length > 6 && (
              <span className="text-xs text-gray-700">+{job.skills.length - 6}</span>
            )}
          </div>
        )}

        {/* Match reasons (if scored) */}
        {matchResult && matchResult.reasons.length > 0 && (
          <div className="bg-white/3 rounded-xl p-3 mb-3 border border-white/5" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-bold mb-1.5" style={{ color: matchColor }}>
              {isAr ? `تطابق ${matchResult.score}%` : `${matchResult.score}% match`}
            </div>
            {matchResult.reasons.slice(0, 2).map((r, i) => (
              <div key={i} className="text-xs text-gray-400 flex items-start gap-1.5 mb-1">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                {r}
              </div>
            ))}
            {matchResult.missingSkills.length > 0 && (
              <div className="text-xs text-gray-600 flex items-center gap-1 mt-1.5">
                <span className="text-amber-400">△</span>
                {isAr ? 'مهارات مطلوبة: ' : 'Missing: '}
                {matchResult.missingSkills.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <SourceBadge source={job.source} />
            <TimeAgo date={job.postedAt} isAr={isAr} />
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {/* AI Match button */}
            {!matchResult && (
              <button
                onClick={() => onMatch(job)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-cyan-500/8 text-cyan-400 border border-cyan-500/15 hover:bg-cyan-500/15 transition-all font-semibold flex items-center gap-1"
              >
                ✦ {isAr ? 'قيّم التطابق' : 'Score match'}
              </button>
            )}
            {/* Save */}
            <button
              onClick={() => onSave(job)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
                isSaved
                  ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                  : 'bg-white/4 border-white/8 text-gray-500 hover:text-yellow-400 hover:border-yellow-500/20'
              }`}
              title={isSaved ? (isAr ? 'محفوظ' : 'Saved') : (isAr ? 'حفظ' : 'Save')}
            >
              {isSaved ? '★' : '☆'}
            </button>
            {/* Apply */}
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-300 border border-cyan-500/25 hover:from-cyan-500/30 hover:to-cyan-500/20 transition-all font-bold"
            >
              {isAr ? 'تقدّم ←' : 'Apply →'}
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Job Detail Drawer ─────────────────────────────────────────────────────────

function JobDrawer({
  job, isAr, matchResult, cvSkills, isSaved, onClose, onSave, onMatch, onApplyWithCoverLetter,
}: {
  job:         JobPosting
  isAr:        boolean
  matchResult?: JobMatchResult
  cvSkills:    Set<string>
  isSaved:     boolean
  onClose:     () => void
  onSave:      () => void
  onMatch:     () => void
  onApplyWithCoverLetter: () => void
}) {
  const title    = isAr && job.titleAr ? job.titleAr : (job.titleEn || job.title)
  const location = isAr && job.locationAr ? job.locationAr : job.location
  const countryMeta = COUNTRY_META[job.country]
  const matchColor  = matchResult
    ? matchResult.score >= 75 ? '#10B981' : matchResult.score >= 50 ? '#C9A84C' : '#6B7280'
    : '#06B6D4'

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div
        className="w-full max-w-xl bg-[#080E14] border-l border-white/8 flex flex-col h-full overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div className="p-5 border-b border-white/6 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 flex items-center justify-center text-xl font-black text-gray-300 flex-shrink-0">
              {job.company[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-white leading-tight line-clamp-2">{title}</h2>
              <div className="text-sm text-gray-400 mt-0.5">{job.company}</div>
              <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                {countryMeta?.flag} {location}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl flex-shrink-0 transition-colors">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <JobTypeBadge type={job.jobType} isAr={isAr} />
            {job.isRemote && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">🌐 {isAr ? 'عن بُعد' : 'Remote'}</span>
            )}
            {job.isUrgent && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">⚡ {isAr ? 'عاجل' : 'Urgent'}</span>
            )}
          </div>

          {/* Salary */}
          {job.salaryDisplay && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{isAr ? 'الراتب' : 'Salary'}</div>
              <div className="text-emerald-400 font-black text-lg">💰 {job.salaryDisplay}</div>
            </div>
          )}

          {/* AI Match panel */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                ✦ {isAr ? 'تطابق ذكي' : 'AI Match'}
              </div>
              {matchResult && <MatchRing score={matchResult.score} size={52} />}
            </div>
            {matchResult ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1.5">{isAr ? 'نقاط قوتك:' : 'Your strengths:'}</div>
                  {matchResult.reasons.map((r, i) => (
                    <div key={i} className="text-xs text-gray-300 flex items-start gap-2 mb-1">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span> {r}
                    </div>
                  ))}
                </div>
                {matchResult.missingSkills.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1.5">{isAr ? 'المهارات المطلوبة:' : 'Skills to add:'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingSkills.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {matchResult.suggestions.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1.5">{isAr ? 'توصيات:' : 'Suggestions:'}</div>
                    {matchResult.suggestions.map((s, i) => (
                      <div key={i} className="text-xs text-gray-400 flex items-start gap-2 mb-1">
                        <span className="text-cyan-400 mt-0.5 flex-shrink-0">→</span> {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onMatch}
                className="w-full py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/18 transition-all text-sm font-bold flex items-center justify-center gap-2"
              >
                ✦ {isAr ? 'تقييم مدى تطابقك مع هذه الوظيفة' : 'Score my match for this job'}
              </button>
            )}
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">
                {isAr ? 'المهارات المطلوبة' : 'Required skills'}
              </div>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(s => (
                  <span key={s}><SkillPill name={s} matched={!!cvSkills.has(s.toLowerCase())} /></span>
                ))}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                {isAr ? '◆ أخضر = لديك هذه المهارة' : '◆ green = you have this skill'}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">
              {isAr ? 'وصف الوظيفة' : 'Job description'}
            </div>
            <div
              className="text-sm text-gray-300 leading-[1.85] whitespace-pre-wrap"
              dir={isAr && /[\u0600-\u06FF]/.test(job.description) ? 'rtl' : 'ltr'}
            >
              {job.descriptionText || job.description}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-700 space-y-1 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <SourceBadge source={job.source} />
              <span>·</span>
              <TimeAgo date={job.postedAt} isAr={isAr} />
            </div>
          </div>
        </div>

        {/* Sticky CTA footer */}
        <div className="p-4 border-t border-white/6 flex flex-col gap-2.5">
          {/* Apply with cover letter (PRO) */}
          <button
            onClick={onApplyWithCoverLetter}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 hover:from-yellow-400 hover:to-amber-300 transition-all shadow-lg shadow-yellow-500/15"
          >
            ✉ {isAr ? 'تقدّم بخطاب تقديم تلقائي' : 'Apply with AI cover letter'}
          </button>
          <div className="flex gap-2">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/18 transition-all font-bold text-sm flex items-center justify-center gap-1.5"
            >
              {isAr ? 'تقدّم مباشرة ←' : 'Direct apply →'}
            </a>
            <button
              onClick={onSave}
              className={`w-12 rounded-xl border transition-all flex items-center justify-center text-base ${
                isSaved
                  ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                  : 'bg-white/4 border-white/10 text-gray-500 hover:text-yellow-400 hover:border-yellow-500/20'
              }`}
            >
              {isSaved ? '★' : '☆'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function JobsClient() {
  const { data: session } = useSession()
  const { t, isRTL, locale } = useT()
  const cvData = useCVStore(s => s.data)

  const [jobs,         setJobs]        = useState<JobPosting[]>([] as JobPosting[])
  const [total,        setTotal]       = useState(0)
  const [hasMore,      setHasMore]     = useState(false)
  const [loading,      setLoading]     = useState(true)
  const [loadingMore,  setLoadingMore] = useState(false)
  const [page,         setPage]        = useState(1)

  // Filters
  const [query,        setQuery]       = useState('')
  const [country,      setCountry]     = useState<string>('ALL')
  const [sector,       setSector]      = useState<string>('')
  const [jobType,      setJobType]     = useState<string>('ALL')
  const [remoteOnly,   setRemoteOnly]  = useState(false)
  const [freshOnly,    setFreshOnly]   = useState(false)
  const [langFilter,   setLangFilter]  = useState<'ar' | 'en' | 'all'>('all')

  // AI state
  const [matchResults, setMatchResults] = useState<Record<string, JobMatchResult>>({})
  const [matchLoading, setMatchLoading] = useState<Set<string>>(() => new Set<string>())
  const [savedIds,     setSavedIds]     = useState<Set<string>>(() => new Set<string>())

  // Detail drawer
  const [openJob,      setOpenJob]     = useState<JobPosting | null>(null)

  const isAr = isRTL || locale === 'ar'
  const dir  = isRTL ? 'rtl' : 'ltr'

  // CV skills for highlight
  const cvSkills = new Set<string>(
    (cvData?.skills || []).map(s => s.name.toLowerCase())
  )

  // ── Fetch jobs ───────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setPage(1) }
    else        setLoadingMore(true)

    const p = reset ? 1 : page + 1
    const params = new URLSearchParams({
      q:       query,
      country: country,
      sector:  sector,
      type:    jobType,
      remote:  remoteOnly ? 'true' : 'false',
      fresh:   freshOnly  ? 'true' : 'false',
      lang:    langFilter,
      page:    String(p),
      limit:   '20',
    })

    try {
      const res  = await fetch(`/api/jobs/search?${params}`)
      const data = await res.json() as JobSearchResult
      if (reset) {
        setJobs(data.jobs)
      } else {
        setJobs(prev => [...prev, ...data.jobs])
        setPage(p)
      }
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (e) {
      console.error('job fetch failed', e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [query, country, sector, jobType, remoteOnly, freshOnly, langFilter, page])

  useEffect(() => { fetchJobs(true) }, [query, country, sector, jobType, remoteOnly, freshOnly, langFilter])

  // ── Fetch saved jobs ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/jobs/saved')
      .then(r => r.json())
      .then((list: { jobId: string }[]) => {
        setSavedIds(new Set<string>(list.map(j => j.jobId)))
      })
      .catch(() => {})
  }, [session?.user?.id])

  // ── AI match ─────────────────────────────────────────────────────────────────
  const scoreMatch = async (job: JobPosting) => {
    if (!session?.user?.id) return
    if (!cvData?.personal?.fullName) return
    setMatchLoading(prev => { const s = new Set<string>(prev); s.add(job.id); return s })
    try {
      const res = await fetch('/api/jobs/match', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId: job.id, jobData: job, cvData }),
      })
      if (res.ok) {
        const result: JobMatchResult = await res.json()
        setMatchResults(prev => ({ ...prev, [job.id]: result }))
      }
    } finally {
      setMatchLoading(prev => { const s = new Set<string>(prev); s.delete(job.id); return s })
    }
  }

  // ── Save/unsave ──────────────────────────────────────────────────────────────
  const toggleSave = async (job: JobPosting) => {
    if (!session?.user?.id) return
    const isSaved = savedIds.has(job.id)
    setSavedIds(prev => {
      const s = new Set<string>(prev)
      isSaved ? s.delete(job.id) : s.add(job.id)
      return s
    })
    if (isSaved) {
      await fetch('/api/jobs/saved', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId: job.id }),
      })
    } else {
      await fetch('/api/jobs/saved', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId: job.id, jobData: job }),
      })
    }
  }

  // ── Apply with cover letter ───────────────────────────────────────────────────
  const applyWithCoverLetter = (job: JobPosting) => {
    // Pre-fill cover letter page with job data
    const params = new URLSearchParams({
      jobTitle: job.titleEn || job.title,
      company:  job.company,
      jobDesc:  job.descriptionText || job.description.slice(0, 1000),
    })
    window.open(`/cover-letter?${params}`, '_blank')
  }

  const COUNTRIES_LIST: { value: string; flag: string; label: string }[] = [
    { value: 'ALL', flag: '🌍', label: isAr ? 'كل الدول' : 'All Countries' },
    ...Object.entries(COUNTRY_META).map(([k, v]) => ({
      value: k,
      flag:  v.flag,
      label: isAr ? v.labelAr : v.labelEn,
    })),
  ]

  // ── RENDER ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#060A10] text-white" dir={dir}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#060A10]/95 backdrop-blur border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a href="/" className="text-yellow-500 font-black text-xl flex-shrink-0">سيرتي.ai</a>
              <span className="text-gray-700 hidden sm:block">·</span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-cyan-400/80 font-bold">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                {isAr ? 'لوحة الوظائف' : 'Job Board'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {total > 0 && !loading && (
                <span className="text-xs text-gray-600">
                  {total.toLocaleString(isAr ? 'ar-MA' : 'en')} {isAr ? 'وظيفة' : 'jobs'}
                </span>
              )}
              <a href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 border border-white/8 px-3 py-1.5 rounded-lg transition-colors">
                {isAr ? '← لوحتي' : '← Dashboard'}
              </a>
            </div>
          </div>

          {/* Search bar */}
          <div className="pb-3">
            <div className="relative">
              <span className="absolute top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none" style={{ [isRTL ? 'right' : 'left']: '14px' }}>
                🔍
              </span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن وظيفة، شركة، أو مهارة…' : 'Search jobs, companies, skills…'}
                dir={dir}
                className="w-full bg-[#0D1117] border border-white/10 rounded-xl py-2.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none transition-colors"
                style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: '40px', [isRTL ? 'paddingLeft' : 'paddingRight']: '14px' }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex gap-6">

          {/* ── Sidebar filters ────────────────────────────────────────── */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-5">

            {/* Country */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2.5">
                {isAr ? 'الدولة' : 'Country'}
              </div>
              <div className="space-y-1">
                {COUNTRIES_LIST.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCountry(c.value)}
                    className={`w-full text-right flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      country === c.value
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sector */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2.5">
                {isAr ? 'القطاع' : 'Sector'}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSector('')}
                  className={`w-full text-start px-3 py-1.5 rounded-lg text-xs transition-all ${
                    !sector ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                  }`}
                >
                  {isAr ? '🌐 الكل' : '🌐 All sectors'}
                </button>
                {MENA_SECTORS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSector(sector === s.id ? '' : s.id)}
                    className={`w-full text-start px-3 py-1.5 rounded-lg text-xs transition-all ${
                      sector === s.id
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                    }`}
                  >
                    {isAr ? s.labelAr : s.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2.5">
                {isAr ? 'خيارات' : 'Options'}
              </div>
              {[
                { label: isAr ? 'عن بُعد فقط' : 'Remote only',   value: remoteOnly, set: setRemoteOnly },
                { label: isAr ? 'آخر ٧ أيام'  : 'Last 7 days',   value: freshOnly,  set: setFreshOnly  },
              ].map(({ label, value, set }) => (
                <button
                  key={label}
                  onClick={() => set(!value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border ${
                    value
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold'
                      : 'text-gray-500 border-white/6 hover:text-gray-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-xs flex-shrink-0 ${
                    value ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-white/15'
                  }`}>
                    {value ? '✓' : ''}
                  </span>
                  {label}
                </button>
              ))}
            </div>

            {/* Language filter */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2.5">
                {isAr ? 'لغة الوظيفة' : 'Job language'}
              </div>
              <div className="flex gap-1">
                {([
                  { v: 'all', l: '🌐' },
                  { v: 'ar',  l: '🇸🇦' },
                  { v: 'en',  l: '🇬🇧' },
                ] as const).map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setLangFilter(v)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      langFilter === v
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        : 'text-gray-500 border-white/6 hover:text-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* ── Main content ───────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* CV context banner */}
            {cvData?.personal?.fullName && (
              <div className="flex items-center gap-3 bg-cyan-500/5 border border-cyan-500/12 rounded-xl px-4 py-3 mb-5 text-xs">
                <span className="text-cyan-400 text-base flex-shrink-0">✦</span>
                <span className="text-gray-400">
                  {isAr
                    ? `يعرض المهارات المطابقة لـ ${cvData.personal.fullName}`
                    : `Highlighting skills matching ${cvData.personal.fullName}'s CV`}
                </span>
                {!session?.user && (
                  <a href="/auth/login" className="ms-auto text-cyan-400 hover:text-cyan-300 font-bold flex-shrink-0">
                    {isAr ? 'سجّل الدخول للحصول على تقييم AI ←' : 'Sign in for AI scoring →'}
                  </a>
                )}
              </div>
            )}

            {/* Mobile filters bar */}
            <div className="flex lg:hidden items-center gap-2 mb-4 overflow-x-auto pb-2">
              {COUNTRIES_LIST.slice(0, 6).map(c => (
                <button
                  key={c.value}
                  onClick={() => setCountry(c.value)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    country === c.value
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
                      : 'text-gray-500 border-white/8 hover:text-gray-300'
                  }`}
                >
                  {c.flag} {c.label}
                </button>
              ))}
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  remoteOnly ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' : 'text-gray-500 border-white/8'
                }`}
              >
                🌐 {isAr ? 'عن بُعد' : 'Remote'}
              </button>
            </div>

            {/* Job list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#0D1117] border border-white/6 rounded-2xl p-5 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded-lg w-3/4" />
                        <div className="h-3 bg-white/4 rounded-lg w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <div className="h-5 w-20 bg-white/4 rounded-md" />
                      <div className="h-5 w-16 bg-white/4 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold mb-2">{isAr ? 'لا توجد نتائج' : 'No results found'}</h3>
                <p className="text-gray-500 text-sm mb-5">
                  {isAr ? 'جرّب تغيير الفلاتر أو توسيع البحث' : 'Try adjusting your filters or broadening the search'}
                </p>
                <button
                  onClick={() => { setQuery(''); setCountry('ALL'); setSector(''); setJobType('ALL'); setRemoteOnly(false); setFreshOnly(false) }}
                  className="text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 px-4 py-2 rounded-xl transition-colors"
                >
                  {isAr ? 'إزالة جميع الفلاتر' : 'Clear all filters'}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isAr={isAr}
                      cvSkills={cvSkills}
                      savedIds={savedIds}
                      matchResult={matchResults[job.id]}
                      onSave={toggleSave}
                      onMatch={scoreMatch}
                      onOpen={setOpenJob}
                    />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => fetchJobs(false)}
                      disabled={loadingMore}
                      className="px-8 py-3 rounded-xl bg-white/4 border border-white/8 text-gray-400 hover:text-white hover:border-white/15 transition-all text-sm font-semibold disabled:opacity-50"
                    >
                      {loadingMore ? '…' : (isAr ? 'تحميل المزيد' : 'Load more')}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Job detail drawer ─────────────────────────────────────────── */}
      {openJob && (
        <JobDrawer
          job={openJob}
          isAr={isAr}
          matchResult={matchResults[openJob.id]}
          cvSkills={cvSkills}
          isSaved={savedIds.has(openJob.id)}
          onClose={() => setOpenJob(null)}
          onSave={() => toggleSave(openJob)}
          onMatch={() => scoreMatch(openJob)}
          onApplyWithCoverLetter={() => applyWithCoverLetter(openJob)}
        />
      )}
    </div>
  )
}
