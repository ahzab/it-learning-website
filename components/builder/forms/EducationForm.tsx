'use client'
import { useCVStore } from '@/lib/store'
import { useT }       from '@/lib/i18n/context'
import { EducationCard } from '../widgets/EducationCard'

export function EducationForm() {
  const education      = useCVStore(s=>s.cv.education)
  const cvMode         = useCVStore(s=>s.cv.cvMode)
  const addEducation   = useCVStore(s=>s.addEducation)
  const updateEducation= useCVStore(s=>s.updateEducation)
  const removeEducation= useCVStore(s=>s.removeEducation)
  const { t } = useT()
  const b = t.builder
  const mode = cvMode||'ar'

  const countLabel = `${education.length} ${b.degrees}${education.length !== 1 ? 's' : ''}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">🎓</div>
          <div>
            <h2 className="text-base font-black">{b.educationTitle}</h2>
            <p className="text-[11px] text-gray-600">{countLabel}</p>
          </div>
        </div>
        <button onClick={addEducation} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/18 transition-all">
          {b.addEducation}
        </button>
      </div>

      {education.length===0 ? (
        <div className="py-12 text-center border border-dashed border-white/8 rounded-2xl cursor-pointer hover:border-blue-500/20 transition-all group" onClick={addEducation}>
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🎓</div>
          <p className="text-gray-600 text-sm">{b.emptyEducation}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {education.map((edu,idx)=>(
            <EducationCard key={edu.id} edu={edu} index={idx} mode={mode} total={education.length}
              onUpdate={d=>updateEducation(edu.id,d)}
              onRemove={()=>removeEducation(edu.id)}/>
          ))}
          <button onClick={addEducation} className="w-full py-3 rounded-2xl border border-dashed border-white/8 text-gray-600 text-sm hover:border-blue-500/25 hover:text-blue-400 transition-all">
            {b.addAnotherEdu}
          </button>
        </div>
      )}
    </div>
  )
}
