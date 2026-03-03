'use client'
import { useCVStore } from '@/lib/store'
import { useT }       from '@/lib/i18n/context'
import { SkillsBoard }   from '../widgets/SkillsBoard'
import { LanguageWidget } from '../widgets/LanguageWidget'

export function SkillsForm() {
  const cvMode    = useCVStore(s=>s.cv.cvMode)
  const skills    = useCVStore(s=>s.cv.skills)
  const languages = useCVStore(s=>s.cv.languages)
  const { t } = useT()
  const b = t.builder
  const mode = cvMode||'ar'

  const skillCountLabel = `${skills.length} ${b.skillsAdded}`
  const langCountLabel  = `${languages.length} ${b.languageCount}${languages.length !== 1 ? 's' : ''}`

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg">⚡</div>
          <div>
            <h2 className="text-base font-black">{b.skillsTitle}</h2>
            <p className="text-[11px] text-gray-600">{skillCountLabel}</p>
          </div>
        </div>
        <SkillsBoard />
        {mode==='bilingual' && skills.length>0 && (
          <p className="text-[10px] text-gray-700 mt-3">✓ {b.skillsUniversal}</p>
        )}
      </div>

      <div className="border-t border-white/6 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">🌐</div>
          <div>
            <h2 className="text-base font-black">{b.languagesTitle}</h2>
            <p className="text-[11px] text-gray-600">{langCountLabel}</p>
          </div>
        </div>
        <LanguageWidget />
      </div>
    </div>
  )
}
