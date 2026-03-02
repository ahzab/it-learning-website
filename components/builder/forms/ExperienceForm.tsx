'use client'
// components/builder/forms/ExperienceForm.tsx — Widget-based
import { useCVStore } from '@/lib/store'
import { ExperienceCard } from '../widgets/ExperienceCard'

export function ExperienceForm() {
  const experience        = useCVStore(s=>s.cv.experience)
  const cvMode            = useCVStore(s=>s.cv.cvMode)
  const addExperience     = useCVStore(s=>s.addExperience)
  const updateExperience  = useCVStore(s=>s.updateExperience)
  const removeExperience  = useCVStore(s=>s.removeExperience)
  const reorderExperience = useCVStore(s=>s.reorderExperience)
  const mode=cvMode||'ar', isEn=mode==='en'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg">💼</div>
          <div>
            <h2 className="text-base font-black">{isEn?'Work Experience':'الخبرة المهنية'}</h2>
            <p className="text-[11px] text-gray-600">{isEn?`${experience.length} position${experience.length!==1?'s':''}`:` ${experience.length} خبرة`}</p>
          </div>
        </div>
        <button onClick={addExperience} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-yellow-500/12 border border-yellow-500/20 text-yellow-400 font-bold hover:bg-yellow-500/20 transition-all">
          + {isEn?'Add':'إضافة'}
        </button>
      </div>

      {experience.length===0 ? (
        <div className="py-12 text-center border border-dashed border-white/8 rounded-2xl cursor-pointer hover:border-yellow-500/20 transition-all group" onClick={addExperience}>
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💼</div>
          <p className="text-gray-600 text-sm">{isEn?'Click to add your first position':'انقر لإضافة أول خبرة وظيفية'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {experience.map((exp,idx)=>(
            <ExperienceCard key={exp.id} exp={exp} index={idx} mode={mode} total={experience.length}
              onUpdate={d=>updateExperience(exp.id,d)}
              onRemove={()=>removeExperience(exp.id)}
              onMoveUp={idx>0?()=>reorderExperience(idx,idx-1):undefined}
              onMoveDown={idx<experience.length-1?()=>reorderExperience(idx,idx+1):undefined}
            />
          ))}
          <button onClick={addExperience} className="w-full py-3 rounded-2xl border border-dashed border-white/8 text-gray-600 text-sm hover:border-yellow-500/25 hover:text-yellow-400 transition-all">
            + {isEn?'Add another position':'إضافة خبرة أخرى'}
          </button>
        </div>
      )}
    </div>
  )
}
