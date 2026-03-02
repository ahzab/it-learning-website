'use client'
// components/builder/widgets/SectionProgress.tsx
// Compact completion status for each CV section shown in the sidebar nav.

import { useCVStore } from '@/lib/store'

interface SectionMeta {
  key: string
  labelAr: string
  labelEn: string
  icon: string
  getPct: (cv: any) => number
}

const SECTIONS: SectionMeta[] = [
  {
    key: 'personal',
    labelAr: 'المعلومات الشخصية',
    labelEn: 'Personal Info',
    icon: '👤',
    getPct: (cv) => {
      const p = cv.personal
      const fields = [p.fullName || p.fullNameEn, p.jobTitle || p.jobTitleEn, p.email, p.phone, p.summary || p.summaryEn]
      return Math.round((fields.filter(Boolean).length / fields.length) * 100)
    },
  },
  {
    key: 'experience',
    labelAr: 'الخبرة المهنية',
    labelEn: 'Experience',
    icon: '💼',
    getPct: (cv) => {
      if (!cv.experience.length) return 0
      const filled = cv.experience.filter((e: any) => (e.jobTitle || e.jobTitleEn) && (e.company || e.companyEn) && (e.description || e.descriptionEn)).length
      return Math.round((filled / cv.experience.length) * 100)
    },
  },
  {
    key: 'education',
    labelAr: 'التعليم',
    labelEn: 'Education',
    icon: '🎓',
    getPct: (cv) => {
      if (!cv.education.length) return 0
      const filled = cv.education.filter((e: any) => (e.degree || e.degreeEn) && (e.institution || e.institutionEn)).length
      return Math.round((filled / cv.education.length) * 100)
    },
  },
  {
    key: 'skills',
    labelAr: 'المهارات',
    labelEn: 'Skills',
    icon: '⚡',
    getPct: (cv) => {
      const hasSkills = cv.skills.length >= 3
      const hasLangs  = cv.languages.length >= 1
      return hasSkills && hasLangs ? 100 : hasSkills || hasLangs ? 60 : cv.skills.length > 0 ? 30 : 0
    },
  },
]

function getColor(pct: number) {
  if (pct === 100) return { bar: '#22C55E', text: 'text-emerald-400' }
  if (pct >= 60)  return { bar: '#C9A84C', text: 'text-yellow-400' }
  if (pct > 0)    return { bar: '#6B7280', text: 'text-gray-400' }
  return { bar: '#374151', text: 'text-gray-700' }
}

interface Props {
  activeSection: string
  onSectionClick: (key: string) => void
  isEn: boolean
}

export function SectionProgress({ activeSection, onSectionClick, isEn }: Props) {
  const cv = useCVStore(s => s.cv)

  // Overall CV completion
  const allPcts = SECTIONS.map(s => s.getPct(cv))
  const overall = Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length)
  const overallColor = getColor(overall)

  return (
    <div className="space-y-1">
      {/* Overall bar */}
      <div className="px-1 pb-3 mb-1 border-b border-white/6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-600 font-semibold">{isEn ? 'CV Completion' : 'اكتمال السيرة'}</span>
          <span className={['text-xs font-black', overallColor.text].join(' ')}>{overall}%</span>
        </div>
        <div className="h-1 bg-white/6 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overall}%`, background: overallColor.bar }}
          />
        </div>
      </div>

      {/* Section buttons */}
      {SECTIONS.map(s => {
        const pct    = s.getPct(cv)
        const color  = getColor(pct)
        const active = activeSection === s.key

        return (
          <button
            key={s.key}
            onClick={() => onSectionClick(s.key)}
            className={[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right group',
              active
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'hover:bg-white/4 border border-transparent hover:border-white/8',
            ].join(' ')}
          >
            {/* Icon */}
            <span className="text-base flex-shrink-0">{s.icon}</span>

            {/* Label + mini bar */}
            <div className="flex-1 min-w-0">
              <div className={['text-xs font-bold truncate', active ? 'text-yellow-300' : 'text-gray-300'].join(' ')}>
                {isEn ? s.labelEn : s.labelAr}
              </div>
              <div className="mt-1 h-0.5 bg-white/6 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color.bar }}
                />
              </div>
            </div>

            {/* Pct badge */}
            <div className={[
              'text-[10px] font-black flex-shrink-0 w-7 text-center',
              pct === 100 ? 'text-emerald-400' : pct >= 60 ? 'text-yellow-500' : 'text-gray-700',
            ].join(' ')}>
              {pct === 100 ? '✓' : `${pct}%`}
            </div>
          </button>
        )
      })}
    </div>
  )
}
