import React, { type ReactNode } from 'react'
// components/cv/templates/GoldenTemplate.tsx
import { CVData, CVMode } from '@/types/cv'
import { t, sectionLabel, dateRange, isLTR } from './bilingualHelpers'

interface Props { data: CVData }

export function GoldenTemplate({ data }: Props) {
  const { personal: p, experience, education, skills, languages, certificates } = data
  const mode: CVMode = data.cvMode || 'ar'
  const hasPhoto = !!p.photo
  const ltr = isLTR(mode)
  const isBi = mode === 'bilingual'
  const dir = ltr ? 'ltr' : 'rtl'

  const displayName = ltr ? (p.fullNameEn || p.fullName) : p.fullName
  const displayTitle = t(p.jobTitle, p.jobTitleEn, mode)
  const displayLocation = t(p.location, p.locationEn, mode)
  const displaySummary = t(p.summary, p.summaryEn, mode)

  return (
    <div style={{ background: '#0D0D0D', color: '#F0EDE8', fontFamily: "'Cairo', sans-serif", direction: dir, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.15)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A1400, #2A2000, #1A1400)', padding: '40px 40px 36px', borderBottom: '2px solid #C9A84C' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {hasPhoto && <img src={p.photo} alt={displayName} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #C9A84C', flexShrink: 0 }} />}
          <div>
            {isBi && p.fullNameEn ? (
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#F0EDE8', lineHeight: 1.1 }}>{p.fullName}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: 'rgba(201,168,76,0.6)', direction: 'ltr', textAlign: 'left' }}>{p.fullNameEn}</div>
              </div>
            ) : (
              <div style={{ fontSize: 34, fontWeight: 900, color: '#F0EDE8' }}>{displayName || (ltr ? 'Full Name' : 'الاسم الكامل')}</div>
            )}
            {isBi && p.jobTitleEn ? (
              <div style={{ marginTop: 4 }}>
                <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{p.jobTitle}</span>
                <span style={{ color: 'rgba(201,168,76,0.3)', margin: '0 8px' }}>|</span>
                <span style={{ color: 'rgba(201,168,76,0.7)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', direction: 'ltr' }}>{p.jobTitleEn}</span>
              </div>
            ) : (
              <div style={{ color: '#C9A84C', fontSize: 13, marginTop: 5, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>{displayTitle || (ltr ? 'Job Title' : 'المسمى الوظيفي')}</div>
            )}
            <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
              {p.email && <span style={{ color: '#888', fontSize: 12 }}>📧 {p.email}</span>}
              {p.phone && <span style={{ color: '#888', fontSize: 12 }}>📞 {p.phone}</span>}
              {displayLocation && <span style={{ color: '#888', fontSize: 12 }}>📍 {displayLocation}</span>}
              {p.website && <span style={{ color: '#888', fontSize: 12 }}>🔗 {p.website}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px' }}>
        <div style={{ padding: '30px 36px', borderLeft: ltr ? 'none' : '1px solid rgba(255,255,255,0.06)', borderRight: ltr ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          {(displaySummary || (isBi && p.summaryEn)) && (
            <Section title={sectionLabel('الملف المهني', 'Professional Profile', mode)}>
              {isBi && p.summary && p.summaryEn ? (
                <>
                  <p style={{ color: '#999', fontSize: 12, lineHeight: 1.8, marginBottom: 8 }}>{p.summary}</p>
                  <p style={{ color: '#888', fontSize: 12, lineHeight: 1.8, direction: 'ltr', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>{p.summaryEn}</p>
                </>
              ) : (
                <p style={{ color: '#999', fontSize: 13, lineHeight: 1.8 }}>{displaySummary}</p>
              )}
            </Section>
          )}

          {experience.length > 0 && (
            <Section title={sectionLabel('الخبرة المهنية', 'Work Experience', mode)}>
              {experience.map((exp, i) => (
                <div key={exp.id} style={{ marginBottom: i < experience.length - 1 ? 20 : 0, paddingBottom: i < experience.length - 1 ? 20 : 0, borderBottom: i < experience.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {isBi && exp.jobTitleEn ? `${exp.jobTitle} / ${exp.jobTitleEn}` : t(exp.jobTitle, exp.jobTitleEn, mode)}
                  </div>
                  <div style={{ color: '#C9A84C', fontSize: 12, marginTop: 2 }}>
                    {isBi && exp.companyEn ? `${exp.company} / ${exp.companyEn}` : t(exp.company, exp.companyEn, mode)}
                  </div>
                  <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{dateRange(exp.startDate, exp.endDate, exp.isCurrent, mode)}</div>
                  {isBi && exp.description && exp.descriptionEn ? (
                    <div style={{ marginTop: 6 }}>
                      <p style={{ color: '#999', fontSize: 12, lineHeight: 1.7 }}>{exp.description}</p>
                      <p style={{ color: '#888', fontSize: 12, lineHeight: 1.7, direction: 'ltr', marginTop: 4 }}>{exp.descriptionEn}</p>
                    </div>
                  ) : t(exp.description, exp.descriptionEn, mode) ? (
                    <p style={{ color: '#999', fontSize: 12, lineHeight: 1.7, marginTop: 6 }}>{t(exp.description, exp.descriptionEn, mode)}</p>
                  ) : null}
                </div>
              ))}
            </Section>
          )}

          {education.length > 0 && (
            <Section title={sectionLabel('التعليم', 'Education', mode)}>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {t(edu.degree, edu.degreeEn, mode)}{t(edu.field, edu.fieldEn, mode) ? ` - ${t(edu.field, edu.fieldEn, mode)}` : ''}
                  </div>
                  <div style={{ color: '#C9A84C', fontSize: 12 }}>{t(edu.institution, edu.institutionEn, mode)}</div>
                  <div style={{ color: '#555', fontSize: 11 }}>{edu.endDate}{edu.gpa ? ` | ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </Section>
          )}
        </div>

        <div style={{ padding: '30px 24px', background: '#111' }}>
          {skills.length > 0 && (
            <SideSection title={sectionLabel('المهارات', 'Skills', mode)}>
              {skills.map(skill => (
                <div key={skill.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#CCC', marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{skill.name}</span>
                    <span style={{ color: '#C9A84C' }}>{skill.level === 'expert' ? '95%' : skill.level === 'advanced' ? '85%' : skill.level === 'intermediate' ? '70%' : '50%'}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #C9A84C, #E8C97A)', width: skill.level === 'expert' ? '95%' : skill.level === 'advanced' ? '85%' : skill.level === 'intermediate' ? '70%' : '50%' }} />
                  </div>
                </div>
              ))}
            </SideSection>
          )}
          {languages.length > 0 && (
            <SideSection title={sectionLabel('اللغات', 'Languages', mode)}>
              {languages.map(lang => (
                <div key={lang.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, textTransform: 'uppercase' }}>{lang.name}</div>
                  <div style={{ fontSize: 12, color: '#CCC' }}>{lang.level === 'native' ? (ltr ? 'Native' : 'أصلية') : lang.level === 'professional' ? (ltr ? 'Professional' : 'محترف') : lang.level === 'conversational' ? (ltr ? 'Conversational' : 'جيد') : (ltr ? 'Basic' : 'أساسي')}</div>
                </div>
              ))}
            </SideSection>
          )}
          {(p.nationality || p.maritalStatus || p.dateOfBirth || p.visaStatus) && (
            <SideSection title={sectionLabel('بيانات شخصية', 'Personal Info', mode)}>
              {p.nationality && <InfoRow label={ltr ? 'Nationality' : 'الجنسية'} value={p.nationality} />}
              {p.maritalStatus && <InfoRow label={ltr ? 'Marital Status' : 'الحالة الاجتماعية'} value={p.maritalStatus} />}
              {p.dateOfBirth && <InfoRow label={ltr ? 'Date of Birth' : 'تاريخ الميلاد'} value={p.dateOfBirth} />}
              {p.visaStatus && <InfoRow label={ltr ? 'Visa' : 'التأشيرة'} value={p.visaStatus} />}
            </SideSection>
          )}
          {certificates.length > 0 && (
            <SideSection title={sectionLabel('الشهادات', 'Certificates', mode)}>
              {certificates.map(cert => (
                <div key={cert.id} style={{ marginBottom: 6 }}>
                  <span style={{ display: 'inline-block', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', padding: '3px 10px', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                    {t(cert.name, cert.nameEn, mode)}
                  </span>
                </div>
              ))}
            </SideSection>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#C9A84C', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        {title}<div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.2)' }} />
      </div>
      {children}
    </div>
  )
}
function SideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#C9A84C', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}<div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.15)' }} />
      </div>
      {children}
    </div>
  )
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#CCC' }}>{value}</div>
    </div>
  )
}
