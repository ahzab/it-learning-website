import React, { type ReactNode } from 'react'
// components/cv/templates/GulfTemplate.tsx
import { CVData, CVMode } from '@/types/cv'
import { t, sectionLabel, dateRange, isLTR } from './bilingualHelpers'

interface Props { data: CVData }

export function GulfTemplate({ data }: Props) {
  const { personal: p, experience, education, skills, languages, certificates } = data
  const mode: CVMode = data.cvMode || 'ar'
  const ltr = isLTR(mode)
  const isBi = mode === 'bilingual'
  const dir = ltr ? 'ltr' : 'rtl'
  const hasPhoto = !!p.photo

  const displayName = ltr ? (p.fullNameEn || p.fullName) : p.fullName

  return (
    <div style={{ background: 'white', color: '#1a1a2e', fontFamily: "'Cairo', sans-serif", direction: dir, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)', padding: '32px 36px', display: 'flex', alignItems: 'center', gap: 20 }}>
        {hasPhoto ? (
          <img src={p.photo} alt={displayName} style={{ width: 90, height: 90, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '3px solid #C9A84C', boxShadow: '0 6px 20px rgba(201,168,76,0.3)' }} />
        ) : (
          <div style={{ width: 90, height: 90, borderRadius: 10, background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, flexShrink: 0 }}>
            {displayName ? displayName[0] : '؟'}
          </div>
        )}
        <div style={{ flex: 1 }}>
          {isBi && p.fullNameEn ? (
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1.1 }}>{p.fullName}</div>
              <div style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.5)', direction: 'ltr', textAlign: 'left' }}>{p.fullNameEn}</div>
            </div>
          ) : (
            <div style={{ fontSize: 26, fontWeight: 900, color: 'white' }}>{displayName}</div>
          )}
          <div style={{ color: '#C9A84C', fontSize: 13, marginTop: 3, fontWeight: 600 }}>
            {isBi && p.jobTitleEn ? `${p.jobTitle} / ${p.jobTitleEn}` : t(p.jobTitle, p.jobTitleEn, mode)}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {p.email && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>📧 {p.email}</span>}
            {p.phone && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>📞 {p.phone}</span>}
            {t(p.location, p.locationEn, mode) && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>📍 {t(p.location, p.locationEn, mode)}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px' }}>
        <div style={{ padding: '24px 30px' }}>
          {t(p.summary, p.summaryEn, mode) && (
            <MainSec title={sectionLabel('الملخص التنفيذي', 'Executive Summary', mode)}>
              {isBi && p.summary && p.summaryEn ? (
                <>
                  <p style={{ color: '#555', fontSize: 12, lineHeight: 1.7, marginBottom: 6 }}>{p.summary}</p>
                  <p style={{ color: '#666', fontSize: 12, lineHeight: 1.7, direction: 'ltr' }}>{p.summaryEn}</p>
                </>
              ) : (
                <p style={{ color: '#555', fontSize: 13, lineHeight: 1.7 }}>{t(p.summary, p.summaryEn, mode)}</p>
              )}
            </MainSec>
          )}
          {experience.length > 0 && (
            <MainSec title={sectionLabel('الخبرة المهنية', 'Work Experience', mode)}>
              {experience.map(exp => (
                <div key={exp.id} style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>
                      {isBi && exp.jobTitleEn ? `${exp.jobTitle} / ${exp.jobTitleEn}` : t(exp.jobTitle, exp.jobTitleEn, mode)}
                    </div>
                    <div style={{ color: '#0f3460', fontSize: 12, fontWeight: 600 }}>
                      {isBi && exp.companyEn ? `${exp.company} / ${exp.companyEn}` : t(exp.company, exp.companyEn, mode)}
                    </div>
                    {isBi && exp.description && exp.descriptionEn ? (
                      <div style={{ marginTop: 4 }}>
                        <p style={{ color: '#666', fontSize: 11, lineHeight: 1.6 }}>{exp.description}</p>
                        <p style={{ color: '#777', fontSize: 11, lineHeight: 1.6, direction: 'ltr', marginTop: 3 }}>{exp.descriptionEn}</p>
                      </div>
                    ) : t(exp.description, exp.descriptionEn, mode) ? (
                      <p style={{ color: '#666', fontSize: 12, lineHeight: 1.6, marginTop: 3 }}>{t(exp.description, exp.descriptionEn, mode)}</p>
                    ) : null}
                  </div>
                  {(exp.startDate || exp.endDate || exp.isCurrent) && (
                    <div style={{ background: '#EEF2FF', color: '#0f3460', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {dateRange(exp.startDate, exp.endDate, exp.isCurrent, mode)}
                    </div>
                  )}
                </div>
              ))}
            </MainSec>
          )}
          {education.length > 0 && (
            <MainSec title={sectionLabel('التعليم', 'Education', mode)}>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>
                      {t(edu.degree, edu.degreeEn, mode)}{t(edu.field, edu.fieldEn, mode) ? ` - ${t(edu.field, edu.fieldEn, mode)}` : ''}
                    </div>
                    <div style={{ color: '#0f3460', fontSize: 12 }}>{t(edu.institution, edu.institutionEn, mode)}</div>
                    {edu.gpa && <div style={{ color: '#999', fontSize: 11 }}>{ltr ? 'GPA:' : 'المعدل:'} {edu.gpa}</div>}
                  </div>
                  {edu.endDate && <div style={{ background: '#EEF2FF', color: '#0f3460', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{edu.endDate}</div>}
                </div>
              ))}
            </MainSec>
          )}
        </div>
        <div style={{ background: '#F8F9FF', padding: '24px 18px', borderRight: ltr ? 'none' : '1px solid #E8ECF8', borderLeft: ltr ? '1px solid #E8ECF8' : 'none' }}>
          {(p.nationality || p.maritalStatus || p.dateOfBirth || p.visaStatus) && (
            <SideSec title={sectionLabel('البيانات الشخصية', 'Personal Data', mode)}>
              {p.nationality && <InfoRow label={ltr ? 'Nationality' : 'الجنسية'} value={p.nationality} />}
              {p.dateOfBirth && <InfoRow label={ltr ? 'Date of Birth' : 'تاريخ الميلاد'} value={p.dateOfBirth} />}
              {p.maritalStatus && <InfoRow label={ltr ? 'Marital Status' : 'الحالة'} value={p.maritalStatus} />}
              {p.visaStatus && <InfoRow label={ltr ? 'Visa' : 'التأشيرة'} value={p.visaStatus} />}
            </SideSec>
          )}
          {skills.length > 0 && (
            <SideSec title={sectionLabel('المهارات', 'Skills', mode)}>
              {skills.map(skill => (
                <div key={skill.id} style={{ marginBottom: 9 }}>
                  <div style={{ fontSize: 11, color: '#333', marginBottom: 3 }}>{skill.name}</div>
                  <div style={{ height: 4, background: '#E8ECF8', borderRadius: 2 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #0f3460, #C9A84C)', width: skill.level === 'expert' ? '95%' : skill.level === 'advanced' ? '80%' : skill.level === 'intermediate' ? '65%' : '45%' }} />
                  </div>
                </div>
              ))}
            </SideSec>
          )}
          {languages.length > 0 && (
            <SideSec title={sectionLabel('اللغات', 'Languages', mode)}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {languages.map(lang => (<span key={lang.id} style={{ background: '#EEF2FF', color: '#0f3460', padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{lang.name}</span>))}
              </div>
            </SideSec>
          )}
          {certificates.length > 0 && (
            <SideSec title={sectionLabel('الشهادات', 'Certificates', mode)}>
              {certificates.map(cert => <div key={cert.id} style={{ fontSize: 11, color: '#333', marginBottom: 5 }}>✓ {t(cert.name, cert.nameEn, mode)}</div>)}
            </SideSec>
          )}
        </div>
      </div>
    </div>
  )
}

function MainSec({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginBottom: 22 }}><div style={{ fontSize: 10, fontWeight: 900, color: '#0f3460', letterSpacing: 2, textTransform: 'uppercase', paddingBottom: 6, borderBottom: '3px solid #C9A84C', marginBottom: 12, display: 'inline-block' }}>{title}</div><div>{children}</div></div>
}
function SideSec({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginBottom: 18 }}><div style={{ fontSize: 9, fontWeight: 900, color: '#0f3460', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 9 }}>{title}</div>{children}</div>
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #EEF2FF' }}><span style={{ fontSize: 10, color: '#999' }}>{label}</span><span style={{ fontSize: 10, fontWeight: 700, color: '#1a1a2e' }}>{value}</span></div>
}
