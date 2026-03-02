'use client'
// components/builder/forms/SkillsForm.tsx — Widget-based
import { useCVStore } from '@/lib/store'
import { SkillsBoard } from '../widgets/SkillsBoard'
import { LanguageWidget } from '../widgets/LanguageWidget'

export function SkillsForm() {
  const cvMode = useCVStore(s=>s.cv.cvMode)
  const skills  = useCVStore(s=>s.cv.skills)
  const languages = useCVStore(s=>s.cv.languages)
  const mode=cvMode||'ar', isEn=mode==='en'

  return (
    <div className="space-y-8">
      {/* Skills */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg">⚡</div>
          <div>
            <h2 className="text-base font-black">{isEn?'Technical Skills':'المهارات التقنية'}</h2>
            <p className="text-[11px] text-gray-600">{isEn?`${skills.length} skill${skills.length!==1?'s':''} added`:` ${skills.length} مهارة مضافة`}</p>
          </div>
        </div>
        <SkillsBoard isEn={isEn}/>
        {mode==='bilingual'&&skills.length>0&&(
          <p className="text-[10px] text-gray-700 mt-3">✓ {isEn?'Skill names are universal — they show identically in both languages':'أسماء المهارات عالمية — تظهر بنفس الشكل في اللغتين'}</p>
        )}
      </div>

      {/* Languages */}
      <div className="border-t border-white/6 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">🌐</div>
          <div>
            <h2 className="text-base font-black">{isEn?'Languages':'اللغات'}</h2>
            <p className="text-[11px] text-gray-600">{isEn?`${languages.length} language${languages.length!==1?'s':''}`:` ${languages.length} لغة`}</p>
          </div>
        </div>
        <LanguageWidget isEn={isEn}/>
      </div>
    </div>
  )
}
