'use client'
// components/builder/forms/PersonalForm.tsx
import { useCVStore } from '@/lib/store'
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

  const p = personal
  const mode = cvMode || 'ar'
  const isEn = mode === 'en'
  const isBi = mode === 'bilingual'

  const summaryVal = isEn ? (p.summaryEn || '') : (p.summary || '')
  const sLen = summaryVal.length

  // Validate on blur — pass the full personal object so cross-field rules work
  const { fieldError, touch } = useValidation(personalSchema)

  const t = (field: string) => () => touch(field)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-lg flex-shrink-0">👤</div>
        <div>
          <h2 className="text-base font-black">{isEn ? 'Personal Information' : 'المعلومات الشخصية'}</h2>
          <p className="text-[11px] text-gray-600">{isEn ? 'Name, contact details and headline' : 'الاسم، التواصل والمسمى الوظيفي'}</p>
        </div>
      </div>

      {/* LinkedIn import banner */}
      <LinkedInImportButton isEn={isEn} variant="banner" />

      <PhotoUpload />

      {/* ── Identity ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {isBi ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SmartInput label="الاسم الكامل" value={p.fullName || ''} onChange={v => update({ fullName: v })}
                dir="rtl" icon="✦" error={fieldError('fullName')} onBlur={t('fullName')} />
              <SmartInput label="Full Name" value={p.fullNameEn || ''} onChange={v => update({ fullNameEn: v })}
                dir="ltr" error={fieldError('fullNameEn')} onBlur={t('fullNameEn')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SmartInput label="المسمى الوظيفي" value={p.jobTitle || ''} onChange={v => update({ jobTitle: v })}
                dir="rtl" icon="💼" error={fieldError('jobTitle')} onBlur={t('jobTitle')} />
              <SmartInput label="Job Title" value={p.jobTitleEn || ''} onChange={v => update({ jobTitleEn: v })}
                dir="ltr" error={fieldError('jobTitleEn')} onBlur={t('jobTitleEn')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SmartInput label="الموقع" value={p.location || ''} onChange={v => update({ location: v })} dir="rtl" icon="📍" />
              <SmartInput label="Location" value={p.locationEn || ''} onChange={v => update({ locationEn: v })} dir="ltr" />
            </div>
          </>
        ) : (
          <>
            <SmartInput
              label={isEn ? 'Full Name' : 'الاسم الكامل'}
              value={isEn ? (p.fullNameEn || '') : (p.fullName || '')}
              onChange={v => isEn ? update({ fullNameEn: v }) : update({ fullName: v })}
              dir={isEn ? 'ltr' : 'rtl'} icon="✦"
              error={fieldError(isEn ? 'fullNameEn' : 'fullName')}
              onBlur={t(isEn ? 'fullNameEn' : 'fullName')} />
            <SmartInput
              label={isEn ? 'Job Title' : 'المسمى الوظيفي'}
              value={isEn ? (p.jobTitleEn || '') : (p.jobTitle || '')}
              onChange={v => isEn ? update({ jobTitleEn: v }) : update({ jobTitle: v })}
              dir={isEn ? 'ltr' : 'rtl'} icon="💼"
              error={fieldError(isEn ? 'jobTitleEn' : 'jobTitle')}
              onBlur={t(isEn ? 'jobTitleEn' : 'jobTitle')} />
            <SmartInput
              label={isEn ? 'Location' : 'الموقع'}
              value={isEn ? (p.locationEn || '') : (p.location || '')}
              onChange={v => isEn ? update({ locationEn: v }) : update({ location: v })}
              dir={isEn ? 'ltr' : 'rtl'} icon="📍" />
          </>
        )}
      </div>

      {/* ── Contact ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <SmartInput
          label={isEn ? 'Email' : 'البريد الإلكتروني'}
          value={p.email || ''} onChange={v => update({ email: v })}
          type="email" dir="ltr" icon="✉"
          error={fieldError('email')} onBlur={t('email')} />
        <SmartInput
          label={isEn ? 'Phone' : 'الهاتف'}
          value={p.phone || ''} onChange={v => update({ phone: v })}
          type="tel" dir="ltr" icon="📞"
          error={fieldError('phone')} onBlur={t('phone')}
          hint={isEn ? 'e.g. +212 6 12 34 56' : 'مثال: 212+ 6 12 34 56'} />
        <SmartInput
          label={isEn ? 'Website' : 'الموقع الإلكتروني'}
          value={p.website || ''} onChange={v => update({ website: v })}
          dir="ltr" icon="🌐"
          error={fieldError('website')} onBlur={t('website')}
          hint="https://..." />
        <SmartInput
          label="LinkedIn"
          value={p.linkedin || ''} onChange={v => update({ linkedin: v })}
          dir="ltr" icon="🔗"
          error={fieldError('linkedin')} onBlur={t('linkedin')}
          hint="https://linkedin.com/in/..." />
      </div>

      {/* ── Summary ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              {isBi ? 'النبذة / Summary' : isEn ? 'Professional Summary' : 'النبذة الشخصية'}
            </span>
            <div className={`text-[10px] mt-0.5 ${sLen >= 200 && sLen <= 400 ? 'text-emerald-500' : 'text-gray-700'}`}>
              {sLen} {isEn ? 'chars — aim for 200–400' : 'حرف — الأفضل ٢٠٠-٤٠٠'} {sLen >= 200 && sLen <= 400 ? '✓' : ''}
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
            label={isEn ? 'Write ✦' : 'اكتب ✦'}
            onApply={text => isEn ? update({ summaryEn: text.trim() }) : update({ summary: text.trim() })}
            disabled={!p.jobTitle && !p.jobTitleEn} />
        </div>
        {isBi ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SmartInput label="النبذة بالعربية" value={p.summary || ''} onChange={v => update({ summary: v })}
              dir="rtl" multiline rows={5} maxLength={800} error={fieldError('summary')} onBlur={t('summary')} />
            <SmartInput label="Summary in English" value={p.summaryEn || ''} onChange={v => update({ summaryEn: v })}
              dir="ltr" multiline rows={5} maxLength={800} error={fieldError('summaryEn')} onBlur={t('summaryEn')} />
          </div>
        ) : (
          <SmartInput
            label={isEn ? 'Write your professional summary...' : 'اكتب نبذتك المهنية...'}
            value={summaryVal}
            onChange={v => isEn ? update({ summaryEn: v }) : update({ summary: v })}
            dir={isEn ? 'ltr' : 'rtl'} multiline rows={5} maxLength={800}
            error={fieldError(isEn ? 'summaryEn' : 'summary')}
            onBlur={t(isEn ? 'summaryEn' : 'summary')} />
        )}
      </div>

      {/* ── Gulf optional fields ──────────────────────────────── */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer list-none select-none">
          <span className="text-[10px] text-yellow-500/60 font-bold uppercase tracking-widest group-open:text-yellow-500/80">
            {isEn ? '▸ Gulf / Regional fields' : '▸ حقول خليجية اختيارية'}
          </span>
          <div className="flex-1 h-px bg-yellow-500/8" />
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <SmartInput label={isEn ? 'Nationality' : 'الجنسية'} value={p.nationality || ''} onChange={v => update({ nationality: v })} dir={isEn ? 'ltr' : 'rtl'} />
          <SmartInput label={isEn ? 'Marital Status' : 'الحالة الاجتماعية'} value={p.maritalStatus || ''} onChange={v => update({ maritalStatus: v })} dir={isEn ? 'ltr' : 'rtl'} />
          <SmartInput label={isEn ? 'Date of Birth' : 'تاريخ الميلاد'} value={p.dateOfBirth || ''} onChange={v => update({ dateOfBirth: v })} type="date" dir="ltr" />
          <SmartInput label={isEn ? 'Visa Status' : 'حالة التأشيرة'} value={p.visaStatus || ''} onChange={v => update({ visaStatus: v })} dir={isEn ? 'ltr' : 'rtl'} />
        </div>
      </details>
    </div>
  )
}
