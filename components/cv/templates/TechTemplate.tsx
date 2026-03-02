import React, { type ReactNode } from 'react'
// components/cv/templates/TechTemplate.tsx
import { CVData, CVMode } from '@/types/cv'
import { t, sectionLabel, dateRange, isLTR } from './bilingualHelpers'

interface Props { data: CVData }

export function TechTemplate({ data }: Props) {
  const { personal: p, experience, education, skills, languages, certificates } = data
  const mode: CVMode = data.cvMode || 'ar'
  const ltr = isLTR(mode)
  const isBi = mode === 'bilingual'
  const dir = ltr ? 'ltr' : 'rtl'
  const hasPhoto = !!p.photo

  const displayName = ltr ? (p.fullNameEn || p.fullName) : p.fullName

  return (
    <div style={{ background: '#0F1117', color: '#E2E8F0', fontFamily: "'Cairo', sans-serif", direction: dir, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ padding: '28px 32px', background: '#161B27', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 18 }}>
        {hasPhoto ? (
          <img src={p.photo} alt={displayName} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '2px solid #06B6D4', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 10, background: 'linear-gradient(135deg, #06B6D4, #0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
            {displayName ? displayName[0] : '⚡'}
          </div>
        )}
        <div>
          {isBi && p.fullNameEn ? (
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', lineHeight: 1.1 }}>{p.fullName}</div>
              <div style={{ fontSize: 16, fontWeight: 400, color: 'rgba(241,245,249,0.4)', direction: 'ltr', textAlign: 'left' }}>{p.fullNameEn}</div>
            </div>
          ) : (
            <div style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9' }}>{displayName}</div>
          )}
          <div style={{ color: '#06B6D4', fontSize: 12, marginTop: 2, fontWeight: 600 }}>
            {isBi && p.jobTitleEn ? `${p.jobTitle}  /  ${p.jobTitleEn}` : t(p.jobTitle, p.jobTitleEn, mode)}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 7, flexWrap: 'wrap' }}>
            {p.email && <span style={{ color: '#64748B', fontSize: 11 }}>📧 {p.email}</span>}
            {p.phone && <span style={{ color: '#64748B', fontSize: 11 }}>📞 {p.phone}</span>}
            {p.website && <span style={{ color: '#64748B', fontSize: 11 }}>🔗 {p.website}</span>}
            {t(p.location, p.locationEn, mode) && <span style={{ color: '#64748B', fontSize: 11 }}>📍 {t(p.location, p.locationEn, mode)}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 210px' }}>
        <div style={{ padding: '22px 28px' }}>
          {t(p.summary, p.summaryEn, mode) && (
            <TechSec title={sectionLabel('الملف المهني', 'About Me', mode)}>
              {isBi && p.summary && p.summaryEn ? (
                <>
                  <p style={{ color: '#64748B', fontSize: 12, lineHeight: 1.7 }}>{p.summary}</p>
                  <p style={{ color: '#64748B', fontSize: 12, lineHeight: 1.7, direction: 'ltr', marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{p.summaryEn}</p>
                </>
              ) : (
                <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.7 }}>{t(p.summary, p.summaryEn, mode)}</p>
              )}
            </TechSec>
          )}
          {experience.length > 0 && (
            <TechSec title={sectionLabel('الخبرة المهنية', 'Work Experience', mode)}>
              {experience.map(exp => (
                <div key={exp.id} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 7, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
                        {isBi && exp.jobTitleEn ? `${exp.jobTitle} / ${exp.jobTitleEn}` : t(exp.jobTitle, exp.jobTitleEn, mode)}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                        {isBi && exp.companyEn ? `${exp.company} / ${exp.companyEn}` : t(exp.company, exp.companyEn, mode)}
                      </div>
                    </div>
                    {(exp.startDate || exp.endDate || exp.isCurrent) && (
                      <div style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4', padding: '2px 9px', borderRadius: 4, fontSize: 9, fontWeight: 700, border: '1px solid rgba(6,182,212,0.2)', whiteSpace: 'nowrap' }}>
                        {dateRange(exp.startDate, exp.endDate, exp.isCurrent, mode)}
                      </div>
                    )}
                  </div>
                  {isBi && exp.description && exp.descriptionEn ? (
                    <div style={{ marginTop: 7 }}>
                      <p style={{ color: '#64748B', fontSize: 11, lineHeight: 1.6 }}>{exp.description}</p>
                      <p style={{ color: '#64748B', fontSize: 11, lineHeight: 1.6, direction: 'ltr', marginTop: 4 }}>{exp.descriptionEn}</p>
                    </div>
                  ) : t(exp.description, exp.descriptionEn, mode) ? (
                    <p style={{ color: '#64748B', fontSize: 12, lineHeight: 1.6, marginTop: 7 }}>{t(exp.description, exp.descriptionEn, mode)}</p>
                  ) : null}
                </div>
              ))}
            </TechSec>
          )}
          {skills.length > 0 && (
            <TechSec title="Tech Stack">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(skill => (<span key={skill.id} style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#06B6D4', padding: '3px 11px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{skill.name}</span>))}
              </div>
            </TechSec>
          )}
        </div>
        <div style={{ background: '#161B27', padding: '22px 18px', borderRight: ltr ? 'none' : '1px solid rgba(255,255,255,0.06)', borderLeft: ltr ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          {education.length > 0 && (
            <SideSec title={sectionLabel('التعليم', 'Education', mode)}>
              {education.map(edu => (
                <div key={edu.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 10px', marginBottom: 7 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#CBD5E1' }}>
                    {t(edu.degree, edu.degreeEn, mode)}{t(edu.field, edu.fieldEn, mode) ? ` - ${t(edu.field, edu.fieldEn, mode)}` : ''}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                    {t(edu.institution, edu.institutionEn, mode)}{edu.endDate ? ` • ${edu.endDate}` : ''}
                  </div>
                </div>
              ))}
            </SideSec>
          )}
          {languages.length > 0 && (
            <SideSec title={sectionLabel('اللغات', 'Languages', mode)}>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{lang.name}</span>
                  <span style={{ fontSize: 9, color: '#06B6D4', background: 'rgba(6,182,212,0.1)', padding: '2px 7px', borderRadius: 3 }}>
                    {lang.level === 'native' ? (ltr ? 'Native' : 'أصلية') : lang.level === 'professional' ? (ltr ? 'Professional' : 'محترف') : lang.level === 'conversational' ? (ltr ? 'Conversational' : 'جيد') : (ltr ? 'Basic' : 'أساسي')}
                  </span>
                </div>
              ))}
            </SideSec>
          )}
          {certificates.length > 0 && (
            <SideSec title={sectionLabel('الشهادات', 'Certificates', mode)}>
              {certificates.map(cert => (
                <div key={cert.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 10px', marginBottom: 7 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#CBD5E1' }}>{t(cert.name, cert.nameEn, mode)}</div>
                  {cert.issuer && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{cert.issuer}{cert.date ? ` • ${cert.date}` : ''}</div>}
                </div>
              ))}
            </SideSec>
          )}
          {(p.nationality || p.visaStatus) && (
            <SideSec title={sectionLabel('بيانات', 'Details', mode)}>
              {p.nationality && <div style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>🌍 {p.nationality}</div>}
              {p.visaStatus && <div style={{ fontSize: 11, color: '#64748B' }}>📋 {p.visaStatus}</div>}
            </SideSec>
          )}
        </div>
      </div>
    </div>
  )
}

function TechSec({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginBottom: 22 }}><div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#06B6D4', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ color: 'rgba(6,182,212,0.4)', fontFamily: 'monospace' }}>//</span>{title}</div>{children}</div>
}
function SideSec({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginBottom: 20 }}><div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#475569', fontWeight: 700, marginBottom: 9 }}>{title}</div>{children}</div>
}
