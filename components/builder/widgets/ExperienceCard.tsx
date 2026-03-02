'use client'
// components/builder/widgets/ExperienceCard.tsx
import { useState } from 'react'
import { Experience } from '@/types/cv'
import { DateRangePicker } from './DateRangePicker'
import { SmartInput } from './SmartInput'
import { AIButton } from '../ai/AIButton'
import { experienceItemSchema } from '@/lib/validation/schemas'
import { useValidation } from '@/lib/validation/useValidation'

function CompletionDot({ pct }: { pct: number }) {
  const r = 9, circ = 2 * Math.PI * r
  const color = pct >= 80 ? '#22C55E' : pct >= 40 ? '#C9A84C' : '#374151'
  return (
    <div className="relative w-6 h-6 flex-shrink-0">
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90 absolute inset-0">
        <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <circle cx="12" cy="12" r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black" style={{ color }}>{pct}</span>
    </div>
  )
}

function calcPct(exp: Experience, mode: string) {
  const bi = mode === 'bilingual'
  const fields = [
    exp.jobTitle || (bi && exp.jobTitleEn),
    exp.company  || (bi && exp.companyEn),
    exp.startDate,
    exp.description || exp.descriptionEn,
  ].filter(Boolean)
  return Math.round(Math.min(fields.length / (bi ? 4 : 3), 1) * 100)
}

interface Props {
  exp: Experience; index: number; mode: string; total: number
  onUpdate: (d: Partial<Experience>) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function ExperienceCard({ exp, index, mode, total, onUpdate, onRemove, onMoveUp, onMoveDown }: Props) {
  const [open, setOpen] = useState(index === 0)
  const [del,  setDel]  = useState(false)
  const isEn = mode === 'en', isBi = mode === 'bilingual'
  const pct     = calcPct(exp, mode)
  const title   = isEn ? (exp.jobTitleEn || exp.jobTitle) : exp.jobTitle
  const company = isEn ? (exp.companyEn  || exp.company)  : exp.company

  const v = useValidation(experienceItemSchema)
  const touch = (field: string) => () => v.touch(field)
  const fe    = (field: string) => v.fieldError(field)

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? 'border-white/14 bg-[#111119] shadow-xl shadow-black/30' : 'border-white/7 bg-[#0C0C15] hover:border-white/12 hover:bg-[#111119]'}`}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none" onClick={() => setOpen(v => !v)}>
        <div className="flex flex-col gap-0.5 cursor-grab flex-shrink-0 opacity-20 hover:opacity-50 transition-opacity" onClick={e => e.stopPropagation()}>
          {[0,1,2].map(i => <div key={i} className="flex gap-0.5">{[0,1].map(j => <div key={j} className="w-[3px] h-[3px] rounded-full bg-gray-400"/>)}</div>)}
        </div>
        <div className="flex flex-col gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp}   disabled={index === 0}          className="text-gray-700 hover:text-gray-400 disabled:opacity-20 text-xs leading-none transition-colors">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1}  className="text-gray-700 hover:text-gray-400 disabled:opacity-20 text-xs leading-none transition-colors">▼</button>
        </div>
        <div className="w-6 h-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-[11px] text-yellow-500 font-black flex-shrink-0">{index + 1}</div>
        <div className="flex-1 min-w-0">
          {title ? (
            <>
              <div className="text-sm font-bold text-white truncate">{title}</div>
              <div className="text-xs text-gray-500 truncate">
                {company}{exp.startDate && ` · ${exp.startDate}${exp.isCurrent ? (isEn ? ' – Present' : ' – حتى الآن') : exp.endDate ? ` – ${exp.endDate}` : ''}`}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600 italic">{isEn ? 'New experience — click to fill' : 'خبرة جديدة — انقر للتعبئة'}</div>
          )}
        </div>
        <CompletionDot pct={pct} />
        <div className={`text-gray-600 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</div>
      </div>

      {/* ── Body ── */}
      {open && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t border-white/6">
          {isBi ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SmartInput label="المسمى الوظيفي" value={exp.jobTitle || ''} onChange={v => onUpdate({ jobTitle: v })}
                  dir="rtl" icon="💼" error={fe('jobTitle')} onBlur={touch('jobTitle')} />
                <SmartInput label="Job Title" value={exp.jobTitleEn || ''} onChange={v => onUpdate({ jobTitleEn: v })}
                  dir="ltr" error={fe('jobTitleEn')} onBlur={touch('jobTitleEn')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SmartInput label="الشركة" value={exp.company || ''} onChange={v => onUpdate({ company: v })}
                  dir="rtl" icon="🏢" error={fe('company')} onBlur={touch('company')} />
                <SmartInput label="Company" value={exp.companyEn || ''} onChange={v => onUpdate({ companyEn: v })}
                  dir="ltr" error={fe('companyEn')} onBlur={touch('companyEn')} />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <SmartInput
                label={isEn ? 'Job Title' : 'المسمى الوظيفي'}
                value={isEn ? (exp.jobTitleEn || '') : (exp.jobTitle || '')}
                onChange={v => isEn ? onUpdate({ jobTitleEn: v }) : onUpdate({ jobTitle: v })}
                dir={isEn ? 'ltr' : 'rtl'} icon="💼"
                error={fe(isEn ? 'jobTitleEn' : 'jobTitle')}
                onBlur={touch(isEn ? 'jobTitleEn' : 'jobTitle')} />
              <SmartInput
                label={isEn ? 'Company' : 'الشركة'}
                value={isEn ? (exp.companyEn || '') : (exp.company || '')}
                onChange={v => isEn ? onUpdate({ companyEn: v }) : onUpdate({ company: v })}
                dir={isEn ? 'ltr' : 'rtl'} icon="🏢"
                error={fe(isEn ? 'companyEn' : 'company')}
                onBlur={touch(isEn ? 'companyEn' : 'company')} />
            </div>
          )}

          <DateRangePicker
            startDate={exp.startDate} endDate={exp.endDate} isCurrent={exp.isCurrent}
            onStartChange={s => onUpdate({ startDate: s })}
            onEndChange={e => onUpdate({ endDate: e })}
            onCurrentChange={c => onUpdate({ isCurrent: c })}
            isEn={isEn} />

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                {isBi ? 'الوصف / Description' : isEn ? 'Description & Achievements' : 'الوصف والإنجازات'}
              </span>
              {(exp.jobTitle || exp.jobTitleEn) && (
                <AIButton action="improve_experience"
                  context={{
                    jobTitle:    isEn ? (exp.jobTitleEn || exp.jobTitle) : exp.jobTitle,
                    company:     isEn ? (exp.companyEn  || exp.company)  : exp.company,
                    description: isEn ? (exp.descriptionEn || exp.description || 'none') : (exp.description || 'none'),
                    lang: isEn ? 'en' : 'ar',
                  }}
                  label={isEn ? '✦ AI Write' : '✦ اكتب AI'}
                  onApply={t => isEn ? onUpdate({ descriptionEn: t.trim() }) : onUpdate({ description: t.trim() })} />
              )}
            </div>
            {isBi ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SmartInput label="الوصف" value={exp.description || ''} onChange={v => onUpdate({ description: v })}
                  dir="rtl" multiline rows={4} maxLength={800}
                  error={fe('description')} onBlur={touch('description')} />
                <SmartInput label="Description" value={exp.descriptionEn || ''} onChange={v => onUpdate({ descriptionEn: v })}
                  dir="ltr" multiline rows={4} maxLength={800}
                  error={fe('descriptionEn')} onBlur={touch('descriptionEn')} />
              </div>
            ) : (
              <SmartInput
                label={isEn ? 'Describe your achievements...' : 'صف إنجازاتك...'}
                value={isEn ? (exp.descriptionEn || '') : (exp.description || '')}
                onChange={v => isEn ? onUpdate({ descriptionEn: v }) : onUpdate({ description: v })}
                dir={isEn ? 'ltr' : 'rtl'} multiline rows={4} maxLength={800}
                hint={isEn ? 'Tip: use numbers — "Increased sales by 35%"' : 'نصيحة: استخدم أرقام — "زدت المبيعات بنسبة 35%"'}
                error={fe(isEn ? 'descriptionEn' : 'description')}
                onBlur={touch(isEn ? 'descriptionEn' : 'description')} />
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-1 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${pct === 100 ? 'bg-emerald-400' : pct >= 40 ? 'bg-yellow-500' : 'bg-gray-700'}`} />
              <span className="text-xs text-gray-700">{pct}% {isEn ? 'complete' : 'مكتمل'}</span>
            </div>
            <button
              onClick={() => { if (del) { onRemove() } else { setDel(true); setTimeout(() => setDel(false), 2500) } }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${del ? 'bg-red-500/15 border border-red-500/30 text-red-400 font-bold' : 'text-gray-700 hover:text-red-400 hover:bg-red-500/8'}`}>
              {del ? (isEn ? '✕ Confirm delete' : '✕ تأكيد الحذف') : (isEn ? 'Remove' : 'حذف')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
