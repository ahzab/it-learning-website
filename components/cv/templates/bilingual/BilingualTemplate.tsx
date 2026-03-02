import React, { type ReactNode } from 'react'
// components/cv/templates/bilingual/BilingualTemplate.tsx
import { CVData } from '@/types/cv'

interface Props { data: CVData }

const GOLD   = '#C9A84C'
const NAVY   = '#0F3460'
const DARK   = '#1A1A2E'
const WHITE  = '#FFFFFF'
const GRAY   = '#6B7280'
const LIGHT  = '#F8F9FF'
const BORDER = '#E5E7EB'

function SecTitle({ arTitle, enTitle, mode }: { arTitle: string; enTitle: string; mode: string }) {
  if (mode === 'bilingual') {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' as const, color: NAVY, paddingBottom: 5, borderBottom: `3px solid ${GOLD}`, direction: 'rtl' as const }}>{arTitle}</div>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' as const, color: GRAY, paddingBottom: 5, borderBottom: `1px solid ${BORDER}` }}>{enTitle}</div>
      </div>
    )
  }
  const title = mode === 'en' ? enTitle : arTitle
  return (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' as const, color: NAVY, paddingBottom: 6, borderBottom: `3px solid ${GOLD}`, marginBottom: 14, display: 'inline-block' }}>
      {title}
    </div>
  )
}

function SideTitle({ ar: arT, en: enT, mode }: { ar: string; en: string; mode: string }) {
  const title = mode === 'en' ? enT : mode === 'bilingual' ? `${arT} / ${enT}` : arT
  return <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' as const, color: NAVY, marginBottom: 10 }}>{title}</div>
}

function BiRow({ left, right, mt = 0 }: { left: ReactNode; right: ReactNode | null; mt?: number }) {
  if (!right) return <div style={{ marginTop: mt }}>{left}</div>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: mt }}>
      <div style={{ borderRight: '1px dashed #E5E7EB', paddingRight: 10 }}>{left}</div>
      <div>{right}</div>
    </div>
  )
}

function DRow({ ar: arL, en: enL, val, mode }: { ar: string; en: string; val: string; mode: string }) {
  const label = mode === 'en' ? enL : mode === 'bilingual' ? `${arL} / ${enL}` : arL
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
      <span style={{ color: '#9CA3AF' }}>{label}</span>
      <span style={{ fontWeight: 700, color: DARK }}>{val}</span>
    </div>
  )
}

export function BilingualTemplate({ data }: Props) {
  const { personal: p, experience, education, skills, languages, certificates } = data
  const mode = data.cvMode || 'ar'
  const isBi = mode === 'bilingual'
  const isEn = mode === 'en'

  const t = (arVal: string, enVal?: string) => isEn ? (enVal || arVal) : arVal
  const hasPhoto = !!p.photo

  return (
    <div style={{ background: WHITE, color: DARK, fontFamily: "'Cairo', sans-serif", borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>

      {/* ── HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, ${NAVY} 100%)`, padding: '28px 32px 24px' }}>
        {isBi && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <span style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)', color: GOLD, padding: '2px 12px', borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
              🌐 BILINGUAL · ثنائي اللغة
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {hasPhoto && (
            <img src={p.photo} alt="photo" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${GOLD}`, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            {isBi ? (
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: WHITE, direction: 'rtl' as const }}>{p.fullName || 'الاسم الكامل'}</span>
                {p.fullNameEn && <span style={{ fontSize: 20, fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 }}>{p.fullNameEn}</span>}
              </div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 900, color: WHITE }}>{t(p.fullName, p.fullNameEn) || (isEn ? 'Full Name' : 'الاسم الكامل')}</div>
            )}

            <div style={{ marginTop: 6 }}>
              {isBi ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {p.jobTitle && <span style={{ color: GOLD, fontSize: 13, fontWeight: 700, direction: 'rtl' as const }}>{p.jobTitle}</span>}
                  {p.jobTitle && p.jobTitleEn && <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: 13 }}>·</span>}
                  {p.jobTitleEn && <span style={{ color: GOLD, fontSize: 13, fontWeight: 400 }}>{p.jobTitleEn}</span>}
                </div>
              ) : (
                <span style={{ color: GOLD, fontSize: 14, fontWeight: 600 }}>{t(p.jobTitle, p.jobTitleEn)}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12 }}>
              {p.email    && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>📧 {p.email}</span>}
              {p.phone    && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>📞 {p.phone}</span>}
              {(p.location || p.locationEn) && (
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>📍 {isBi && p.location && p.locationEn ? `${p.location} / ${p.locationEn}` : t(p.location, p.locationEn)}</span>
              )}
              {p.website  && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>🔗 {p.website}</span>}
              {p.linkedin && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>in {p.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px' }}>

        {/* Main */}
        <div style={{ padding: '24px 28px', borderLeft: `1px solid ${BORDER}` }}>

          {(p.summary || p.summaryEn) && (
            <section style={{ marginBottom: 24 }}>
              <SecTitle arTitle="الملف المهني" enTitle="Professional Summary" mode={mode} />
              {isBi ? (
                <BiRow
                  left={p.summary ? <p style={{ fontSize: 12, lineHeight: 1.8, color: '#555', direction: 'rtl' as const, margin: 0 }}>{p.summary}</p> : null}
                  right={p.summaryEn ? <p style={{ fontSize: 12, lineHeight: 1.8, color: '#555', direction: 'ltr' as const, margin: 0 }}>{p.summaryEn}</p> : null}
                />
              ) : (
                <p style={{ fontSize: 13, lineHeight: 1.75, color: '#555', direction: (isEn ? 'ltr' : 'rtl') as const, margin: 0 }}>
                  {t(p.summary, p.summaryEn)}
                </p>
              )}
            </section>
          )}

          {experience.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <SecTitle arTitle="الخبرة المهنية" enTitle="Work Experience" mode={mode} />
              {experience.map((exp, i) => (
                <div key={exp.id} style={{ marginBottom: i < experience.length - 1 ? 16 : 0, paddingBottom: i < experience.length - 1 ? 16 : 0, borderBottom: i < experience.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      {isBi ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, direction: 'rtl' as const }}>{exp.jobTitle}</span>
                            {exp.jobTitleEn && <span style={{ fontSize: 12, fontWeight: 500, color: GRAY }}>{exp.jobTitleEn}</span>}
                          </div>
                          <div style={{ fontSize: 12, color: NAVY, fontWeight: 600, marginTop: 2 }}>
                            {exp.company}{exp.companyEn ? ` / ${exp.companyEn}` : ''}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{t(exp.jobTitle, exp.jobTitleEn)}</div>
                          <div style={{ fontSize: 12, color: NAVY, fontWeight: 600, marginTop: 2 }}>{t(exp.company, exp.companyEn)}</div>
                        </div>
                      )}
                    </div>
                    {(exp.startDate || exp.endDate || exp.isCurrent) && (
                      <span style={{ fontSize: 11, color: GRAY, background: '#F3F4F6', padding: '2px 9px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {exp.startDate}{(exp.startDate && (exp.endDate || exp.isCurrent)) ? ' — ' : ''}{exp.isCurrent ? (isEn ? 'Present' : 'حتى الآن') : exp.endDate}
                      </span>
                    )}
                  </div>
                  {isBi && (exp.description || exp.descriptionEn) ? (
                    <BiRow mt={8}
                      left={exp.description ? <p style={{ fontSize: 12, color: GRAY, lineHeight: 1.65, direction: 'rtl' as const, margin: 0 }}>{exp.description}</p> : null}
                      right={exp.descriptionEn ? <p style={{ fontSize: 12, color: GRAY, lineHeight: 1.65, direction: 'ltr' as const, margin: 0 }}>{exp.descriptionEn}</p> : null}
                    />
                  ) : (
                    (exp.description || exp.descriptionEn) && (
                      <p style={{ fontSize: 12, color: GRAY, lineHeight: 1.65, marginTop: 6, direction: (isEn ? 'ltr' : 'rtl') as const, margin: '6px 0 0' }}>
                        {t(exp.description, exp.descriptionEn)}
                      </p>
                    )
                  )}
                </div>
              ))}
            </section>
          )}

          {education.length > 0 && (
            <section>
              <SecTitle arTitle="التعليم" enTitle="Education" mode={mode} />
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: 12 }}>
                  {isBi ? (
                    <BiRow
                      left={
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, direction: 'rtl' as const }}>{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</div>
                          <div style={{ fontSize: 11, color: NAVY, marginTop: 1 }}>{edu.institution}</div>
                        </div>
                      }
                      right={(edu.degreeEn || edu.institutionEn) ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{edu.degreeEn || edu.degree}{(edu.fieldEn || edu.field) ? ` - ${edu.fieldEn || edu.field}` : ''}</div>
                          <div style={{ fontSize: 11, color: NAVY, marginTop: 1 }}>{edu.institutionEn || edu.institution}</div>
                        </div>
                      ) : null}
                    />
                  ) : (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>
                        {isEn ? `${edu.degreeEn || edu.degree}${(edu.fieldEn || edu.field) ? ` - ${edu.fieldEn || edu.field}` : ''}` : `${edu.degree}${edu.field ? ` - ${edu.field}` : ''}`}
                      </div>
                      <div style={{ fontSize: 12, color: NAVY, fontWeight: 600, marginTop: 2 }}>{t(edu.institution, edu.institutionEn)}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{edu.endDate}{edu.gpa ? ` · ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ padding: '24px 18px', background: LIGHT }}>
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SideTitle ar="المهارات" en="Skills" mode={mode} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {skills.map(s => (
                  <span key={s.id} style={{ background: '#EEF2FF', color: NAVY, border: `1px solid ${NAVY}22`, padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>{s.name}</span>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SideTitle ar="اللغات" en="Languages" mode={mode} />
              {languages.map(lang => {
                const pct = lang.level === 'native' ? '100%' : lang.level === 'professional' ? '80%' : lang.level === 'conversational' ? '60%' : '40%'
                const lvlAr = lang.level === 'native' ? 'أصلية' : lang.level === 'professional' ? 'محترف' : lang.level === 'conversational' ? 'جيد' : 'أساسي'
                const lvlEn = lang.level === 'native' ? 'Native' : lang.level === 'professional' ? 'Professional' : lang.level === 'conversational' ? 'Conversational' : 'Basic'
                return (
                  <div key={lang.id} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{lang.name}</span>
                      <span style={{ fontSize: 10, color: GRAY, background: '#E5E7EB', padding: '1px 6px', borderRadius: 3 }}>
                        {isBi ? `${lvlAr} · ${lvlEn}` : isEn ? lvlEn : lvlAr}
                      </span>
                    </div>
                    <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${NAVY}, ${GOLD})`, width: pct }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {certificates.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SideTitle ar="الشهادات" en="Certifications" mode={mode} />
              {certificates.map(cert => (
                <div key={cert.id} style={{ marginBottom: 7 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: DARK }}>{cert.name}</div>
                  {cert.issuer && <div style={{ fontSize: 10, color: '#9CA3AF' }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</div>}
                </div>
              ))}
            </div>
          )}

          {(p.nationality || p.maritalStatus || p.dateOfBirth || p.visaStatus) && (
            <div>
              <SideTitle ar="بيانات" en="Details" mode={mode} />
              {p.nationality   && <DRow ar="الجنسية"  en="Nationality" val={p.nationality}   mode={mode} />}
              {p.maritalStatus && <DRow ar="الحالة"    en="Status"      val={p.maritalStatus} mode={mode} />}
              {p.dateOfBirth   && <DRow ar="الميلاد"   en="D.O.B"       val={p.dateOfBirth}   mode={mode} />}
              {p.visaStatus    && <DRow ar="التأشيرة"  en="Visa"        val={p.visaStatus}    mode={mode} />}
            </div>
          )}
        </div>
      </div>

      {isBi && (
        <div style={{ background: `linear-gradient(90deg, ${DARK}, ${NAVY})`, padding: '7px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as const, direction: 'rtl' as const }}>سيرة ذاتية ثنائية اللغة</span>
          <span style={{ color: 'rgba(201,168,76,0.4)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as const }}>Bilingual Resume</span>
        </div>
      )}
    </div>
  )
}
