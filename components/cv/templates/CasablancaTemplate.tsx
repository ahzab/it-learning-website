import React, { type ReactNode } from 'react'
// components/cv/templates/CasablancaTemplate.tsx
import { CVData, CVMode } from '@/types/cv'
import { t, sectionLabel, dateRange, isLTR } from './bilingualHelpers'

interface Props { data: CVData }

export function CasablancaTemplate({ data }: Props) {
  const { personal: p, experience, education, skills, languages, certificates } = data
  const mode: CVMode = data.cvMode || 'ar'
  const ltr = isLTR(mode)
  const isBi = mode === 'bilingual'
  const dir = ltr ? 'ltr' : 'rtl'
  const hasPhoto = !!p.photo

  const displayName = ltr ? (p.fullNameEn || p.fullName) : p.fullName
  const displayTitle = t(p.jobTitle, p.jobTitleEn, mode)
  const displaySummary = t(p.summary, p.summaryEn, mode)

  const langDots = (level: string) => {
    const filled = level === 'native' ? 5 : level === 'professional' ? 4 : level === 'conversational' ? 3 : 2
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < filled ? '#10B981' : '#D1FAE5' }} />
    ))
  }

  return (
    <div style={{ background: 'white', color: '#1a1a1a', fontFamily: "'Cairo', sans-serif", direction: dir, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: '#0D4F3C', display: 'grid', gridTemplateColumns: '160px 1fr' }}>
        <div style={{ background: '#083D2E', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {hasPhoto ? (
            <img src={p.photo} alt={displayName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)', marginBottom: 12 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 12, border: '3px solid rgba(255,255,255,0.15)' }}>
              {displayName ? displayName[0] : '؟'}
            </div>
          )}
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 1.6 }}>
            {p.phone && <div>{p.phone}</div>}
            {(t(p.location, p.locationEn, mode)) && <div style={{ marginTop: 4 }}>{t(p.location, p.locationEn, mode)}</div>}
          </div>
        </div>
        <div style={{ padding: '28px 24px' }}>
          {isBi && p.fullNameEn ? (
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{p.fullName}</div>
              <div style={{ fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.55)', direction: 'ltr', textAlign: 'left' }}>{p.fullNameEn}</div>
            </div>
          ) : (
            <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>{displayName || (ltr ? 'Full Name' : 'الاسم الكامل')}</div>
          )}
          <div style={{ color: '#6EE7B7', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
            {isBi && p.jobTitleEn ? `${p.jobTitle} / ${p.jobTitleEn}` : displayTitle}
          </div>
          {isBi && p.summary && p.summaryEn ? (
            <div style={{ marginTop: 10 }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 1.7 }}>{p.summary}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.7, marginTop: 4, direction: 'ltr' }}>{p.summaryEn}</p>
            </div>
          ) : displaySummary ? (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>{displaySummary}</p>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12 }}>
            {p.email && <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>📧 {p.email}</span>}
            {p.website && <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>🔗 {p.website}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr' }}>
        <div style={{ background: '#F0FAF6', padding: '20px' }}>
          {languages.length > 0 && (
            <SideSection title={sectionLabel('اللغات', 'Languages', mode)}>
              {languages.map(lang => (
                <div key={lang.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{lang.name}</div>
                  <div style={{ display: 'flex', gap: 3 }}>{langDots(lang.level)}</div>
                </div>
              ))}
            </SideSection>
          )}
          {education.length > 0 && (
            <SideSection title={sectionLabel('التعليم', 'Education', mode)}>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0D4F3C' }}>{t(edu.degree, edu.degreeEn, mode)}</div>
                  {t(edu.field, edu.fieldEn, mode) && <div style={{ fontSize: 11, color: '#666' }}>{t(edu.field, edu.fieldEn, mode)}</div>}
                  <div style={{ fontSize: 11, color: '#666' }}>{t(edu.institution, edu.institutionEn, mode)}</div>
                  {edu.endDate && <div style={{ fontSize: 10, color: '#999' }}>{edu.endDate}</div>}
                </div>
              ))}
            </SideSection>
          )}
          {certificates.length > 0 && (
            <SideSection title={sectionLabel('الشهادات', 'Certificates', mode)}>
              {certificates.map(cert => <div key={cert.id} style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>✓ {t(cert.name, cert.nameEn, mode)}</div>)}
            </SideSection>
          )}
          {(p.nationality || p.maritalStatus) && (
            <SideSection title={sectionLabel('بيانات', 'Details', mode)}>
              {p.nationality && <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>🌍 {p.nationality}</div>}
              {p.maritalStatus && <div style={{ fontSize: 11, color: '#555' }}>👤 {p.maritalStatus}</div>}
            </SideSection>
          )}
        </div>
        <div style={{ padding: '20px 24px' }}>
          {experience.length > 0 && (
            <MainSection title={sectionLabel('الخبرة المهنية', 'Work Experience', mode)}>
              {experience.map(exp => (
                <div key={exp.id} style={{ marginBottom: 14, paddingRight: ltr ? 0 : 12, paddingLeft: ltr ? 12 : 0, borderRight: ltr ? 'none' : '2px solid #D1FAE5', borderLeft: ltr ? '2px solid #D1FAE5' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {isBi && exp.jobTitleEn ? `${exp.jobTitle} / ${exp.jobTitleEn}` : t(exp.jobTitle, exp.jobTitleEn, mode)}
                  </div>
                  <div style={{ color: '#10B981', fontSize: 11, marginTop: 1 }}>
                    {isBi && exp.companyEn ? `${exp.company} / ${exp.companyEn}` : t(exp.company, exp.companyEn, mode)}
                    {(exp.startDate || exp.endDate || exp.isCurrent) && ` • ${dateRange(exp.startDate, exp.endDate, exp.isCurrent, mode)}`}
                  </div>
                  {isBi && exp.description && exp.descriptionEn ? (
                    <div style={{ marginTop: 4 }}>
                      <p style={{ color: '#555', fontSize: 11, lineHeight: 1.6 }}>{exp.description}</p>
                      <p style={{ color: '#777', fontSize: 11, lineHeight: 1.6, direction: 'ltr', marginTop: 3 }}>{exp.descriptionEn}</p>
                    </div>
                  ) : t(exp.description, exp.descriptionEn, mode) ? (
                    <p style={{ color: '#555', fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>{t(exp.description, exp.descriptionEn, mode)}</p>
                  ) : null}
                </div>
              ))}
            </MainSection>
          )}
          {skills.length > 0 && (
            <MainSection title={sectionLabel('المهارات', 'Skills', mode)}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(skill => (<span key={skill.id} style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{skill.name}</span>))}
              </div>
            </MainSection>
          )}
        </div>
      </div>
    </div>
  )
}

function SideSection({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginBottom: 18 }}><div style={{ fontSize: 10, fontWeight: 800, color: '#0D4F3C', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 5, borderBottom: '2px solid #10B981' }}>{title}</div>{children}</div>
}
function MainSection({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, fontWeight: 800, color: '#0D4F3C', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}><div style={{ width: 4, height: 14, background: '#10B981', borderRadius: 2, flexShrink: 0 }} />{title}</div>{children}</div>
}
