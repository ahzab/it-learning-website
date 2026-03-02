import React, { type ReactNode } from 'react'
// components/cv/templates/MinimalTemplate.tsx
import { CVData, CVMode } from '@/types/cv'
import { t, sectionLabel, isLTR } from './bilingualHelpers'

interface Props { data: CVData }

export function MinimalTemplate({ data }: Props) {
  const { personal: p, experience, education, skills, languages } = data
  const mode: CVMode = data.cvMode || 'ar'
  const ltr = isLTR(mode)
  const isBi = mode === 'bilingual'
  const dir = ltr ? 'ltr' : 'rtl'
  const hasPhoto = !!p.photo

  const displayName = ltr ? (p.fullNameEn || p.fullName) : p.fullName

  return (
    <div style={{ background: '#FEFEFE', color: '#111', fontFamily: isBi || ltr ? "'Cairo', sans-serif" : "'Amiri', serif", direction: dir, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '40px 48px 28px', borderBottom: '1px solid #F0F0F0', position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ position: 'absolute', top: 0, right: ltr ? 'auto' : 0, left: ltr ? 0 : 'auto', width: 5, height: '100%', background: '#111' }} />
        {hasPhoto && <img src={p.photo} alt={displayName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E0E0E0', flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          {isBi && p.fullNameEn ? (
            <div>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>{p.fullName}</div>
              <div style={{ fontSize: 22, fontWeight: 300, color: '#888', direction: 'ltr', textAlign: 'left', fontFamily: "'Cairo', sans-serif" }}>{p.fullNameEn}</div>
            </div>
          ) : (
            <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>{displayName}</div>
          )}
          <div style={{ fontSize: 15, color: '#888', marginTop: 7, fontFamily: "'Cairo', sans-serif", fontWeight: 300 }}>
            {isBi && p.jobTitleEn ? `${p.jobTitle}  /  ${p.jobTitleEn}` : t(p.jobTitle, p.jobTitleEn, mode)}
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
            {p.email && <span style={{ fontSize: 12, color: '#666', fontFamily: "'Cairo', sans-serif" }}>{p.email}</span>}
            {p.phone && <span style={{ fontSize: 12, color: '#666', fontFamily: "'Cairo', sans-serif" }}>{p.phone}</span>}
            {t(p.location, p.locationEn, mode) && <span style={{ fontSize: 12, color: '#666', fontFamily: "'Cairo', sans-serif" }}>{t(p.location, p.locationEn, mode)}</span>}
            {p.website && <span style={{ fontSize: 12, color: '#666', fontFamily: "'Cairo', sans-serif" }}>{p.website}</span>}
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 48px' }}>
        {t(p.summary, p.summaryEn, mode) && (
          <Sec title={sectionLabel('ملف مهني', 'Profile', mode)}>
            {isBi && p.summary && p.summaryEn ? (
              <div>
                <p style={{ fontSize: 13, lineHeight: 1.9, color: '#444', fontFamily: "'Cairo', sans-serif", fontWeight: 300 }}>{p.summary}</p>
                <p style={{ fontSize: 13, lineHeight: 1.9, color: '#555', fontFamily: "'Cairo', sans-serif", fontWeight: 300, direction: 'ltr', marginTop: 6, paddingTop: 6, borderTop: '1px solid #F0F0F0' }}>{p.summaryEn}</p>
              </div>
            ) : (
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#444', fontFamily: "'Cairo', sans-serif", fontWeight: 300 }}>{t(p.summary, p.summaryEn, mode)}</p>
            )}
          </Sec>
        )}
        <Divider />
        {experience.length > 0 && (
          <Sec title={sectionLabel('خبرة مهنية', 'Experience', mode)}>
            {experience.map(exp => (
              <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 18, marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: '#999', fontFamily: "'Cairo', sans-serif", paddingTop: 3 }}>
                  {exp.startDate}<br />{exp.isCurrent ? (ltr ? 'Present' : 'حتى الآن') : exp.endDate}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {isBi && exp.jobTitleEn ? `${exp.jobTitle} / ${exp.jobTitleEn}` : t(exp.jobTitle, exp.jobTitleEn, mode)}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2, fontFamily: "'Cairo', sans-serif" }}>
                    {isBi && exp.companyEn ? `${exp.company} / ${exp.companyEn}` : t(exp.company, exp.companyEn, mode)}
                  </div>
                  {isBi && exp.description && exp.descriptionEn ? (
                    <div style={{ marginTop: 5 }}>
                      <p style={{ fontSize: 12, color: '#777', lineHeight: 1.8, fontFamily: "'Cairo', sans-serif" }}>{exp.description}</p>
                      <p style={{ fontSize: 12, color: '#888', lineHeight: 1.8, fontFamily: "'Cairo', sans-serif", direction: 'ltr', marginTop: 4 }}>{exp.descriptionEn}</p>
                    </div>
                  ) : t(exp.description, exp.descriptionEn, mode) ? (
                    <p style={{ fontSize: 13, color: '#777', lineHeight: 1.8, marginTop: 5, fontFamily: "'Cairo', sans-serif" }}>{t(exp.description, exp.descriptionEn, mode)}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </Sec>
        )}
        <Divider />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {education.length > 0 && (
            <Sec title={sectionLabel('تعليم', 'Education', mode)}>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{t(edu.degree, edu.degreeEn, mode)}</div>
                  {t(edu.field, edu.fieldEn, mode) && <div style={{ fontSize: 12, color: '#777', fontFamily: "'Cairo', sans-serif" }}>{t(edu.field, edu.fieldEn, mode)}</div>}
                  <div style={{ fontSize: 12, color: '#888', fontFamily: "'Cairo', sans-serif" }}>{t(edu.institution, edu.institutionEn, mode)}</div>
                  {edu.endDate && <div style={{ fontSize: 11, color: '#BBB', fontFamily: "'Cairo', sans-serif" }}>{edu.endDate}</div>}
                </div>
              ))}
            </Sec>
          )}
          <div>
            {skills.length > 0 && (
              <Sec title={sectionLabel('مهارات', 'Skills', mode)}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skills.map(skill => (<span key={skill.id} style={{ border: '1px solid #E0E0E0', color: '#444', padding: '4px 13px', borderRadius: 2, fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>{skill.name}</span>))}
                </div>
              </Sec>
            )}
            {languages.length > 0 && (
              <Sec title={sectionLabel('لغات', 'Languages', mode)}>
                {languages.map(lang => (
                  <div key={lang.id} style={{ fontSize: 13, color: '#666', fontFamily: "'Cairo', sans-serif", lineHeight: 2 }}>
                    {lang.name} — <span style={{ color: '#999' }}>{lang.level === 'native' ? (ltr ? 'Native' : 'أصلية') : lang.level === 'professional' ? (ltr ? 'Professional' : 'محترف') : lang.level === 'conversational' ? (ltr ? 'Conversational' : 'جيد') : (ltr ? 'Basic' : 'أساسي')}</span>
                  </div>
                ))}
              </Sec>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Sec({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginBottom: 26 }}><div style={{ fontSize: 9, color: '#AAA', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 16, fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>{title}</div>{children}</div>
}
function Divider() {
  return <div style={{ height: 1, background: '#F0F0F0', marginBottom: 28 }} />
}
