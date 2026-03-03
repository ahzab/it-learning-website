'use client'
// components/builder/widgets/SectionProgress.tsx
import { useCVStore } from '@/lib/store'
import { useT } from '@/lib/i18n/context'

const SECTIONS = [
  { id: 'personal',   icon: '👤', fields: ['fullName','jobTitle','email','summary'] },
  { id: 'experience', icon: '💼', fields: ['experience'] },
  { id: 'education',  icon: '🎓', fields: ['education'] },
  { id: 'skills',     icon: '⚡', fields: ['skills'] },
] as const

type SectionId = typeof SECTIONS[number]['id']

interface Props {
  activeSection:   string
  onSectionClick:  (s: string) => void
}

function calcSectionScore(cv: any, section: typeof SECTIONS[number]): number {
  if (section.id === 'personal') {
    const p = cv.personal
    let score = 0
    if (p.fullName || p.fullNameEn) score += 25
    if (p.jobTitle || p.jobTitleEn) score += 25
    if (p.email)                    score += 25
    if (p.summary || p.summaryEn)   score += 25
    return score
  }
  if (section.id === 'experience') return cv.experience.length >= 2 ? 100 : cv.experience.length === 1 ? 50 : 0
  if (section.id === 'education')  return cv.education.length  >= 1 ? 100 : 0
  if (section.id === 'skills')     return cv.skills.length >= 5 ? 100 : cv.skills.length > 0 ? Math.round(cv.skills.length * 20) : 0
  return 0
}

export function SectionProgress({ activeSection, onSectionClick }: Props) {
  const cv = useCVStore(s => s.cv)
  const { t } = useT()
  const b = t.builder

  const overallScore = Math.round(SECTIONS.reduce((sum, s) => sum + calcSectionScore(cv, s), 0) / SECTIONS.length)

  return (
    <div className="px-4 space-y-1">
      {/* Overall */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-600 font-semibold">{b.cvCompletion}</span>
          <span className="text-xs font-bold text-yellow-400">{overallScore}%</span>
        </div>
        <div className="h-1 bg-white/6 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${overallScore}%`,
              background: overallScore < 40 ? '#ef4444' : overallScore < 70 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
      </div>

      {/* Section buttons */}
      {SECTIONS.map((s) => {
        const score  = calcSectionScore(cv, s)
        const active = activeSection === s.id
        return (
          <button
            key={s.id}
            onClick={() => onSectionClick(s.id)}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-start group',
              active
                ? 'border-yellow-500/40 bg-yellow-500/8 text-yellow-400'
                : 'border-white/6 hover:border-white/15 hover:bg-white/3 text-gray-400 hover:text-gray-200',
            ].join(' ')}
          >
            <span className="text-sm flex-shrink-0">{s.icon}</span>
            <span className="flex-1 text-xs font-bold">{b.sections[s.id]}</span>
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {score === 100 && <span className="text-emerald-400 text-xs">✓</span>}
              {score > 0 && score < 100 && (
                <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500/60 rounded-full" style={{ width: `${score}%` }} />
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
