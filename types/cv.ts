// types/cv.ts

export type Language = 'ar' | 'fr' | 'en'
export type CVMode = 'ar' | 'en' | 'bilingual'   // ← NEW: language display mode
export type Country = 'MA' | 'AE' | 'SA' | 'EG' | 'QA' | 'KW' | 'DZ' | 'TN'
export type Template = 'golden' | 'casablanca' | 'gulf' | 'minimal' | 'tech'

// ── Bilingual field: every text field can have ar + en version ────────
export interface BilingualText {
  ar: string
  en: string
}

export interface PersonalInfo {
  fullName: string
  fullNameEn?: string        // ← English version
  jobTitle: string
  jobTitleEn?: string        // ← English version
  email: string
  phone: string
  location: string
  locationEn?: string        // ← English version
  website?: string
  linkedin?: string
  summary: string
  summaryEn?: string         // ← English version
  photo?: string
  // Gulf-specific fields
  nationality?: string
  dateOfBirth?: string
  maritalStatus?: string
  visaStatus?: string
}

export interface Experience {
  id: string
  jobTitle: string
  jobTitleEn?: string        // ← English
  company: string
  companyEn?: string         // ← English
  location?: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
  descriptionEn?: string     // ← English
  achievements: string[]
}

export interface Education {
  id: string
  degree: string
  degreeEn?: string          // ← English
  field: string
  fieldEn?: string           // ← English
  institution: string
  institutionEn?: string     // ← English
  location?: string
  startDate: string
  endDate: string
  gpa?: string
  honors?: string
}

export interface Skill {
  id: string
  name: string
  nameEn?: string            // ← English
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface Language_Item {
  id: string
  name: string
  level: 'basic' | 'conversational' | 'professional' | 'native'
}

export interface Certificate {
  id: string
  name: string
  nameEn?: string            // ← English
  issuer: string
  date: string
  url?: string
}

export interface CVData {
  personal: PersonalInfo
  experience: Experience[]
  education: Education[]
  skills: Skill[]
  languages: Language_Item[]
  certificates: Certificate[]
  template: Template
  language: Language
  cvMode: CVMode             // ← NEW: 'ar' | 'en' | 'bilingual'
  country: Country
  colorScheme: string
}

export interface CVState {
  data: CVData
  activeSection: string
  isSaving: boolean
  lastSaved?: Date
}

// Default empty CV
export const defaultCV: CVData = {
  personal: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certificates: [],
  template: 'golden',
  language: 'ar',
  cvMode: 'ar',
  country: 'MA',
  colorScheme: 'gold',
}

// ── Helpers ─────────────────────────────────────────────────────────
export function getText(ar: string, en: string | undefined, mode: CVMode): string {
  if (mode === 'en') return en || ar
  return ar // bilingual mode renders both separately
}
