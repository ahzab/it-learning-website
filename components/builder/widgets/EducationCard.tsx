'use client'
// components/builder/widgets/EducationCard.tsx
import { useState } from 'react'
import { useT } from '@/lib/i18n/context'
import { Education } from '@/types/cv'
import { SmartInput } from './SmartInput'
import { educationItemSchema } from '@/lib/validation/schemas'
import { useValidation } from '@/lib/validation/useValidation'

const DEG_AR = ['بكالوريا','ليسانس','ماستر','دكتوراه','دبلوم','شهادة مهنية']
const DEG_EN = ["Bachelor's","Master's",'PhD','Diploma','Certificate',"Associate's"]
const DEG_FR = ['Licence','Master','Doctorat','BTS','DUT','Ingénieur']

interface Props {
  edu: Education; index: number; mode: string; total: number
  onUpdate: (d: Partial<Education>) => void
  onRemove: () => void
}

export function EducationCard({ edu, index, mode, total, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState(index === 0)
  const [del,  setDel]  = useState(false)
  const { t, locale } = useT()
  const b = t.builder

  // CV content mode — which DB fields to use
  const isEn = mode === 'en'
  const isBi = mode === 'bilingual'
  const cvDir = isEn ? 'ltr' : 'rtl'

  const deg  = isEn ? (edu.degreeEn || edu.degree) : edu.degree
  const inst = isEn ? (edu.institutionEn || edu.institution) : edu.institution
  // Degree chips: use locale-appropriate labels (these are CV content type labels)
  const degs = locale === 'ar' ? DEG_AR : locale === 'fr' ? DEG_FR : DEG_EN
  const activeDeg = isEn ? edu.degreeEn : edu.degree

  const v = useValidation(educationItemSchema)
  const touch = (field: string) => () => v.touch(field)
  const fe    = (field: string) => v.fieldError(field)

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? 'border-white/14 bg-[#111119] shadow-xl shadow-black/30' : 'border-white/7 bg-[#0C0C15] hover:border-white/12'}`}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none" onClick={() => setOpen(v => !v)}>
        <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] text-blue-400 font-black flex-shrink-0">{index + 1}</div>
        <div className="flex-1 min-w-0">
          {deg ? (
            <>
              <div className="text-sm font-bold text-white truncate">
                {deg}{(edu.field || edu.fieldEn) && ` — ${isEn ? (edu.fieldEn || edu.field) : edu.field}`}
              </div>
              <div className="text-xs text-gray-500 truncate">{inst}{edu.endDate && ` · ${edu.endDate}`}</div>
            </>
          ) : (
            <div className="text-sm text-gray-600 italic">{b.emptyEducation}</div>
          )}
        </div>
        <div className={`text-gray-600 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</div>
      </div>

      {/* ── Body ── */}
      {open && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t border-white/6">
          {/* Degree quick-select */}
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2">{b.degreeType}</p>
            <div className="flex flex-wrap gap-1.5">
              {degs.map(d => (
                <button key={d} onClick={() => isEn ? onUpdate({ degreeEn: d }) : onUpdate({ degree: d })}
                  className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${activeDeg === d ? 'border-yellow-500/40 bg-yellow-500/12 text-yellow-300 font-bold' : 'border-white/8 text-gray-600 hover:border-white/18 hover:text-gray-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {isBi ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SmartInput label="الشهادة" value={edu.degree || ''} onChange={v => onUpdate({ degree: v })} dir="rtl" />
                <SmartInput label="Degree" value={edu.degreeEn || ''} onChange={v => onUpdate({ degreeEn: v })} dir="ltr" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SmartInput label="التخصص" value={edu.field || ''} onChange={v => onUpdate({ field: v })} dir="rtl" />
                <SmartInput label="Field of Study" value={edu.fieldEn || ''} onChange={v => onUpdate({ fieldEn: v })} dir="ltr" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SmartInput label="المؤسسة" value={edu.institution || ''} onChange={v => onUpdate({ institution: v })}
                  dir="rtl" icon="🎓" error={fe('institution')} onBlur={touch('institution')} />
                <SmartInput label="Institution" value={edu.institutionEn || ''} onChange={v => onUpdate({ institutionEn: v })}
                  dir="ltr" icon="🎓" error={fe('institutionEn')} onBlur={touch('institutionEn')} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <SmartInput label={b.degreeField}
                value={isEn ? (edu.degreeEn || '') : (edu.degree || '')}
                onChange={v => isEn ? onUpdate({ degreeEn: v }) : onUpdate({ degree: v })}
                dir={cvDir} />
              <SmartInput label={b.fieldOfStudy}
                value={isEn ? (edu.fieldEn || '') : (edu.field || '')}
                onChange={v => isEn ? onUpdate({ fieldEn: v }) : onUpdate({ field: v })}
                dir={cvDir} />
              <SmartInput label={b.institutionLabel}
                value={isEn ? (edu.institutionEn || '') : (edu.institution || '')}
                onChange={v => isEn ? onUpdate({ institutionEn: v }) : onUpdate({ institution: v })}
                dir={cvDir} icon="🎓"
                error={fe(isEn ? 'institutionEn' : 'institution')}
                onBlur={touch(isEn ? 'institutionEn' : 'institution')} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SmartInput label={b.graduationYear}
              value={edu.endDate || ''} onChange={v => onUpdate({ endDate: v })}
              dir="ltr" icon="📅"
              hint={b.graduationHint}
              error={fe('endDate')} onBlur={touch('endDate')} />
            <SmartInput label={b.gpaLabel}
              value={edu.gpa || ''} onChange={v => onUpdate({ gpa: v })}
              dir="ltr"
              hint={b.gpaHint}
              error={fe('gpa')} onBlur={touch('gpa')} />
          </div>

          <div className="flex justify-end pt-1 border-t border-white/5">
            <button
              onClick={() => { if (del) { onRemove() } else { setDel(true); setTimeout(() => setDel(false), 2500) } }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${del ? 'bg-red-500/15 border border-red-500/30 text-red-400 font-bold' : 'text-gray-700 hover:text-red-400 hover:bg-red-500/8'}`}>
              {del ? b.confirmDelete : b.deleteBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
