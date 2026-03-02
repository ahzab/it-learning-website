'use client'
// components/builder/forms/EducationForm.tsx — Widget-based
import { useCVStore } from '@/lib/store'
import { EducationCard } from '../widgets/EducationCard'

export function EducationForm() {
  const education      = useCVStore(s=>s.cv.education)
  const cvMode         = useCVStore(s=>s.cv.cvMode)
  const addEducation   = useCVStore(s=>s.addEducation)
  const updateEducation= useCVStore(s=>s.updateEducation)
  const removeEducation= useCVStore(s=>s.removeEducation)
  const mode=cvMode||'ar', isEn=mode==='en'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">🎓</div>
          <div>
            <h2 className="text-base font-black">{isEn?'Education':'التعليم'}</h2>
            <p className="text-[11px] text-gray-600">{isEn?`${education.length} degree${education.length!==1?'s':''}`:` ${education.length} شهادة`}</p>
          </div>
        </div>
        <button onClick={addEducation} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/18 transition-all">
          + {isEn?'Add':'إضافة'}
        </button>
      </div>

      {education.length===0 ? (
        <div className="py-12 text-center border border-dashed border-white/8 rounded-2xl cursor-pointer hover:border-blue-500/20 transition-all group" onClick={addEducation}>
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🎓</div>
          <p className="text-gray-600 text-sm">{isEn?'Click to add your education':'انقر لإضافة شهادتك الدراسية'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {education.map((edu,idx)=>(
            <EducationCard key={edu.id} edu={edu} index={idx} mode={mode} total={education.length}
              onUpdate={d=>updateEducation(edu.id,d)}
              onRemove={()=>removeEducation(edu.id)}/>
          ))}
          <button onClick={addEducation} className="w-full py-3 rounded-2xl border border-dashed border-white/8 text-gray-600 text-sm hover:border-blue-500/25 hover:text-blue-400 transition-all">
            + {isEn?'Add another degree':'إضافة شهادة أخرى'}
          </button>
        </div>
      )}
    </div>
  )
}
