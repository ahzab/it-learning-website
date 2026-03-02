// lib/store.ts
import { create } from 'zustand'
import { CVData, CVMode, defaultCV, Experience, Education, Skill, Language_Item, Certificate } from '@/types/cv'
import { generateId } from './utils'

// ── Normalize AI-generated CV data to ensure all required fields exist ─
export function normalizeCV(raw: Partial<CVData>): CVData {
  const def = defaultCV

  // Ensure every experience has required fields + stable id
  const experience: Experience[] = (raw.experience || []).map((e, i) => ({
    id:           e.id           || generateId(),
    jobTitle:     e.jobTitle     || e.jobTitleEn || '',
    jobTitleEn:   e.jobTitleEn   || '',
    company:      e.company      || e.companyEn  || '',
    companyEn:    e.companyEn    || '',
    location:     e.location     || '',
    startDate:    e.startDate    || '',
    endDate:      e.endDate      || '',
    isCurrent:    e.isCurrent    ?? false,
    description:  e.description  || e.descriptionEn || '',
    descriptionEn: e.descriptionEn || '',
    achievements: Array.isArray(e.achievements) ? e.achievements : [],
  }))

  const education: Education[] = (raw.education || []).map((e, i) => ({
    id:          e.id          || generateId(),
    degree:      e.degree      || e.degreeEn     || '',
    degreeEn:    e.degreeEn    || '',
    field:       e.field       || e.fieldEn      || '',
    fieldEn:     e.fieldEn     || '',
    institution: e.institution || e.institutionEn || '',
    institutionEn: e.institutionEn || '',
    location:    e.location    || '',
    startDate:   e.startDate   || '',
    endDate:     e.endDate     || '',
    gpa:         e.gpa         || '',
    honors:      e.honors      || '',
  }))

  const skills: Skill[] = (raw.skills || []).map((s, i) => ({
    id:    s.id    || generateId(),
    name:  s.name  || '',
    level: (['beginner','intermediate','advanced','expert'].includes(s.level) ? s.level : 'intermediate') as Skill['level'],
  })).filter(s => s.name)

  const languages: Language_Item[] = (raw.languages || []).map((l, i) => ({
    id:    l.id    || generateId(),
    name:  l.name  || '',
    level: (['basic','conversational','professional','native'].includes(l.level) ? l.level : 'professional') as Language_Item['level'],
  })).filter(l => l.name)

  const certificates: Certificate[] = (raw.certificates || []).map((c, i) => ({
    id:     c.id     || generateId(),
    name:   c.name   || '',
    issuer: c.issuer || '',
    date:   c.date   || '',
    url:    c.url    || '',
  }))

  const personal = {
    fullName:      raw.personal?.fullName      || raw.personal?.fullNameEn || def.personal.fullName,
    fullNameEn:    raw.personal?.fullNameEn    || '',
    jobTitle:      raw.personal?.jobTitle      || raw.personal?.jobTitleEn || def.personal.jobTitle,
    jobTitleEn:    raw.personal?.jobTitleEn    || '',
    email:         raw.personal?.email         || def.personal.email,
    phone:         raw.personal?.phone         || def.personal.phone,
    location:      raw.personal?.location      || raw.personal?.locationEn || def.personal.location,
    locationEn:    raw.personal?.locationEn    || '',
    website:       raw.personal?.website       || '',
    linkedin:      raw.personal?.linkedin      || '',
    summary:       raw.personal?.summary       || raw.personal?.summaryEn || def.personal.summary,
    summaryEn:     raw.personal?.summaryEn     || '',
    photo:         raw.personal?.photo         || '',
    nationality:   raw.personal?.nationality   || '',
    dateOfBirth:   raw.personal?.dateOfBirth   || '',
    maritalStatus: raw.personal?.maritalStatus || '',
    visaStatus:    raw.personal?.visaStatus    || '',
  }

  // Validate template / cvMode / country / language against known values
  const validTemplates  = ['golden','casablanca','gulf','minimal','tech']
  const validModes      = ['ar','en','bilingual']
  const validCountries  = ['MA','AE','SA','EG','QA','KW','DZ','TN']
  const validLanguages  = ['ar','en','fr']

  return {
    personal,
    experience,
    education,
    skills,
    languages,
    certificates,
    template:    validTemplates.includes(raw.template  as string) ? raw.template!  : def.template,
    language:    validLanguages.includes(raw.language  as string) ? raw.language!  : def.language,
    cvMode:      validModes.includes(raw.cvMode        as string) ? raw.cvMode!    : def.cvMode,
    country:     validCountries.includes(raw.country   as string) ? raw.country!   : def.country,
    colorScheme: raw.colorScheme || def.colorScheme,
  }
}

interface CVStore {
  cv: CVData
  activeSection: string
  isSaving: boolean

  setActiveSection: (section: string) => void
  updatePersonal:   (data: Partial<CVData['personal']>) => void
  updateTemplate:   (template: CVData['template']) => void
  updateCVLanguage: (language: CVData['language']) => void   // renamed from updateLanguage to avoid conflict
  updateCVMode:     (mode: CVMode) => void
  updateCountry:    (country: CVData['country']) => void

  reorderExperience:  (fromIdx: number, toIdx: number) => void
  addExperience:      () => void
  updateExperience:   (id: string, data: Partial<Experience>) => void
  removeExperience:   (id: string) => void

  addEducation:       () => void
  updateEducation:    (id: string, data: Partial<Education>) => void
  removeEducation:    (id: string) => void

  addSkill:           (name: string) => void
  updateSkill:        (id: string, data: Partial<Skill>) => void
  removeSkill:        (id: string) => void

  addLanguageItem:    (name: string) => void
  updateLanguageItem: (id: string, data: Partial<Language_Item>) => void
  removeLanguageItem: (id: string) => void

  addCertificate:     () => void
  updateCertificate:  (id: string, data: Partial<Certificate>) => void
  removeCertificate:  (id: string) => void

  // Loads a complete CVData object (from AI generate, tailor, or DB) with full normalization
  loadCV:    (data: Partial<CVData>) => void
  setIsSaving: (saving: boolean) => void
}

export const useCVStore = create<CVStore>((set) => ({
  cv: defaultCV,
  activeSection: 'personal',
  isSaving: false,

  setActiveSection: (section) => set({ activeSection: section }),
  setIsSaving:      (isSaving) => set({ isSaving }),

  // loadCV normalizes AI/DB data before storing — this is the key fix
  loadCV: (data) => set({ cv: normalizeCV(data as Partial<CVData>) }),

  updatePersonal:   (data) => set((s) => ({ cv: { ...s.cv, personal: { ...s.cv.personal, ...data } } })),
  updateTemplate:   (template) => set((s) => ({ cv: { ...s.cv, template } })),
  updateCVLanguage: (language) => set((s) => ({ cv: { ...s.cv, language } })),
  updateCVMode:     (cvMode)   => set((s) => ({ cv: { ...s.cv, cvMode } })),
  updateCountry:    (country)  => set((s) => ({ cv: { ...s.cv, country } })),

  // EXPERIENCE
  reorderExperience: (fromIdx, toIdx) => set((s) => {
    const arr = [...s.cv.experience]
    const [item] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, item)
    return { cv: { ...s.cv, experience: arr } }
  }),
  addExperience: () => set((s) => ({
    cv: { ...s.cv, experience: [...s.cv.experience, {
      id: generateId(), jobTitle: '', company: '', startDate: '', endDate: '',
      isCurrent: false, description: '', achievements: [],
    }]},
  })),
  updateExperience: (id, data) => set((s) => ({
    cv: { ...s.cv, experience: s.cv.experience.map((e) => e.id === id ? { ...e, ...data } : e) },
  })),
  removeExperience: (id) => set((s) => ({
    cv: { ...s.cv, experience: s.cv.experience.filter((e) => e.id !== id) },
  })),

  // EDUCATION
  addEducation: () => set((s) => ({
    cv: { ...s.cv, education: [...s.cv.education, {
      id: generateId(), degree: '', field: '', institution: '', startDate: '', endDate: '',
    }]},
  })),
  updateEducation: (id, data) => set((s) => ({
    cv: { ...s.cv, education: s.cv.education.map((e) => e.id === id ? { ...e, ...data } : e) },
  })),
  removeEducation: (id) => set((s) => ({
    cv: { ...s.cv, education: s.cv.education.filter((e) => e.id !== id) },
  })),

  // SKILLS
  addSkill: (name) => set((s) => ({
    cv: { ...s.cv, skills: [...s.cv.skills, { id: generateId(), name, level: 'intermediate' }] },
  })),
  updateSkill: (id, data) => set((s) => ({
    cv: { ...s.cv, skills: s.cv.skills.map((sk) => sk.id === id ? { ...sk, ...data } : sk) },
  })),
  removeSkill: (id) => set((s) => ({
    cv: { ...s.cv, skills: s.cv.skills.filter((sk) => sk.id !== id) },
  })),

  // LANGUAGES (renamed to avoid TypeScript overload conflict)
  addLanguageItem: (name) => set((s) => ({
    cv: { ...s.cv, languages: [...s.cv.languages, { id: generateId(), name, level: 'professional' }] },
  })),
  updateLanguageItem: (id, data) => set((s) => ({
    cv: { ...s.cv, languages: s.cv.languages.map((l) => l.id === id ? { ...l, ...data } : l) },
  })),
  removeLanguageItem: (id) => set((s) => ({
    cv: { ...s.cv, languages: s.cv.languages.filter((l) => l.id !== id) },
  })),

  // CERTIFICATES
  addCertificate: () => set((s) => ({
    cv: { ...s.cv, certificates: [...s.cv.certificates, { id: generateId(), name: '', issuer: '', date: '' }] },
  })),
  updateCertificate: (id, data) => set((s) => ({
    cv: { ...s.cv, certificates: s.cv.certificates.map((c) => c.id === id ? { ...c, ...data } : c) },
  })),
  removeCertificate: (id) => set((s) => ({
    cv: { ...s.cv, certificates: s.cv.certificates.filter((c) => c.id !== id) },
  })),
}))
