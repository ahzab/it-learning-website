'use client'
// components/builder/forms/PersonalForm.tsx
import { useCVStore } from '@/lib/store'
import { useT }       from '@/lib/i18n/context'
import { AIButton }   from '../ai/AIButton'
import { PhotoUpload } from '../PhotoUpload'
import { SmartInput }  from '../widgets/SmartInput'
import { personalSchema } from '@/lib/validation/schemas'
import { useValidation }  from '@/lib/validation/useValidation'
import { LinkedInImportButton } from '@/components/linkedin/LinkedInImportButton'

export function PersonalForm() {
  const personal   = useCVStore(s => s.cv.personal)
  const cvMode     = useCVStore(s => s.cv.cvMode)
  const experience = useCVStore(s => s.cv.experience)
  const skills     = useCVStore(s => s.cv.skills)
  const country    = useCVStore(s => s.cv.country)
  const update     = useCVStore(s => s.updatePersonal)
  const { t, isRTL } = useT()
  const b = t.builder

  const p    = personal
  const mode = cvMode || 'ar'
  const isEn = mode === 'en'
  const isBi = mode === 'bilingual'
  // For CV content direction (which fields to fill), still use cv.cvMode
  // For UI labels, use t.builder.*
  const cvDir = (isEn ? 'ltr' : 'rtl') as 'ltr' | 'rtl'

  const summaryVal = isEn ? (p.summaryEn || '') : (p.summary || '')
  const sLen = summaryVal.length

  const { fieldError, touch } = useValidation(personalSchema)
  const tf = (field: string) => () => touch(field)

  // isEn flag for LinkedInImportButton (controls which CV content direction it gives)
  const cvIsEn = mode === 'en'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg flex-shrink-0">👤</div>
        <div>
          <h2 className="text-base font-black">{b.personalTitle}</h2>
          <p className="text-[11px] text-gray-600">{b.personalSubtitle}</p>
        </div>
      </div>

      <LinkedInImportButton isEn={cvIsEn} variant="banner" />
      <PhotoUpload />

      {/* Identity */}
      <div className="space-y-3">
        {isBi ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SmartInput label={b.fullName} value={p.fullName || ''} onChange={v => update({ fullName: v })}
                dir="rtl" icon="✦" error={fieldError('fullName')} onBlur={tf('fullName')} />
              <SmartInput label="Full Name" value={p.fullNameEn || ''} onChange={v => update({ fullNameEn: v })}
                dir="ltr" error={fieldError('fullNameEn')} onBlur={tf('fullNameEn')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SmartInput label={b.jobTitleField} value={p.jobTitle || ''} onChange={v => update({ jobTitle: v })}
                dir="rtl" icon="💼" error={fieldError('jobTitle')} onBlur={tf('jobTitle')} />
              <SmartInput label="Job Title" value={p.jobTitleEn || ''} onChange={v => update({ jobTitleEn: v })}
                dir="ltr" error={fieldError('jobTitleEn')} onBlur={tf('jobTitleEn')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SmartInput label={b.locationField} value={p.location || ''} onChange={v => update({ location: v })} dir="rtl" icon="📍" />
              <SmartInput label="Location" value={p.locationEn || ''} onChange={v => update({ locationEn: v })} dir="ltr" />
            </div>
          </>
        ) : (
          <>
            <SmartInput
              label={b.fullName}
              value={isEn ? (p.fullNameEn || '') : (p.fullName || '')}
              onChange={v => isEn ? update({ fullNameEn: v }) : update({ fullName: v })}
              dir={cvDir} icon="✦"
              error={fieldError(isEn ? 'fullNameEn' : 'fullName')}
              onBlur={tf(isEn ? 'fullNameEn' : 'fullName')} />
            <SmartInput
              label={b.jobTitleField}
              value={isEn ? (p.jobTitleEn || '') : (p.jobTitle || '')}
              onChange={v => isEn ? update({ jobTitleEn: v }) : update({ jobTitle: v })}
              dir={cvDir} icon="💼"
              error={fieldError(isEn ? 'jobTitleEn' : 'jobTitle')}
              onBlur={tf(isEn ? 'jobTitleEn' : 'jobTitle')} />
            <SmartInput
              label={b.locationField}
              value={isEn ? (p.locationEn || '') : (p.location || '')}
              onChange={v => isEn ? update({ locationEn: v }) : update({ location: v })}
              dir={cvDir} icon="📍" />
          </>
        )}
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <SmartInput label={b.emailField} value={p.email || ''} onChange={v => update({ email: v })}
          type="email" dir="ltr" icon="✉" error={fieldError('email')} onBlur={tf('email')} />
        <SmartInput label={b.phoneField} value={p.phone || ''} onChange={v => update({ phone: v })}
          type="tel" dir="ltr" icon="📞" error={fieldError('phone')} onBlur={tf('phone')} hint={b.phoneHint} />
        <SmartInput label={b.websiteField} value={p.website || ''} onChange={v => update({ website: v })}
          dir="ltr" icon="🌐" error={fieldError('website')} onBlur={tf('website')} hint="https://..." />
        <SmartInput label="LinkedIn" value={p.linkedin || ''} onChange={v => update({ linkedin: v })}
          dir="ltr" icon="🔗" error={fieldError('linkedin')} onBlur={tf('linkedin')} hint="https://linkedin.com/in/..." />
      </div>

      {/* Summary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              {isBi ? b.summaryBi : b.summaryLabel}
            </span>
            <div className={`text-[10px] mt-0.5 ${sLen >= 200 && sLen <= 400 ? 'text-emerald-500' : 'text-gray-700'}`}>
              {sLen} {b.summaryChars} {sLen >= 200 && sLen <= 400 ? '✓' : ''}
            </div>
          </div>
          <AIButton
            action="generate_summary"
            context={{
              jobTitle: isEn ? (p.jobTitleEn || p.jobTitle) : p.jobTitle,
              experiences: experience.map(e => isEn
                ? (e.jobTitleEn || e.jobTitle) + ' at ' + (e.companyEn || e.company)
                : `${e.jobTitle} في ${e.company}`
              ).join(', '),
              skills: skills.map(s => s.name).join(', '),
              market: country === 'MA' ? 'Moroccan' : 'Gulf',
              lang: isEn ? 'en' : 'ar',
            }}
            label={b.writeBtn}
            onApply={text => isEn ? update({ summaryEn: text.trim() }) : update({ summary: text.trim() })}
            disabled={!p.jobTitle && !p.jobTitleEn}
          />
        </div>
        {isBi ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SmartInput label={b.summaryLabel} value={p.summary || ''} onChange={v => update({ summary: v })}
              dir="rtl" multiline rows={5} maxLength={800} error={fieldError('summary')} onBlur={tf('summary')} />
            <SmartInput label="Summary in English" value={p.summaryEn || ''} onChange={v => update({ summaryEn: v })}
              dir="ltr" multiline rows={5} maxLength={800} error={fieldError('summaryEn')} onBlur={tf('summaryEn')} />
          </div>
        ) : (
          <SmartInput
            label={b.summaryLabel}
            value={summaryVal}
            onChange={v => isEn ? update({ summaryEn: v }) : update({ summary: v })}
            dir={cvDir} multiline rows={5} maxLength={800}
            error={fieldError(isEn ? 'summaryEn' : 'summary')}
            onBlur={tf(isEn ? 'summaryEn' : 'summary')} />
        )}
      </div>

      {/* Gulf optional fields */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer list-none select-none">
          <span className="text-[10px] text-yellow-500/60 font-bold uppercase tracking-widest group-open:text-yellow-500/80">
            {b.gulfFields}
          </span>
          <div className="flex-1 h-px bg-yellow-500/8" />
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <SmartInput label={b.nationality}    value={p.nationality    || ''} onChange={v => update({ nationality: v })}    dir={cvDir} />
          <SmartInput label={b.maritalStatus}  value={p.maritalStatus  || ''} onChange={v => update({ maritalStatus: v })}  dir={cvDir} />
          <SmartInput label={b.dateOfBirth}    value={p.dateOfBirth    || ''} onChange={v => update({ dateOfBirth: v })}    type="date" dir="ltr" />
          <SmartInput label={b.visaStatus}     value={p.visaStatus     || ''} onChange={v => update({ visaStatus: v })}     dir={cvDir} />
        </div>
      </details>
    </div>
  )
}
