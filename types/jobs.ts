// types/jobs.ts
// Unified job posting type across all Arabic job board sources.

export type JobSource =
  | 'bayt'       // Bayt.com — pan-Arab, strongest in Gulf + Levant
  | 'wuzzuf'     // Wuzzuf.net — Egypt's #1 job board
  | 'naukrigulf' // NaukriGulf.com — India/Gulf crossover, huge in UAE/SA
  | 'tanqeeb'    // Tanqeeb.com — GCC-focused
  | 'linkedin'   // LinkedIn Arabia RSS
  | 'akhtaboot'  // Akhtaboot.com — Jordan/Palestine/GCC
  | 'forasna'    // Forasna.com — Morocco + Maghreb
  | 'rekrut'     // Rekrut.ma — Morocco tech
  | 'emploi'     // EmploiMaroc.ma — Morocco general

export type JobCountry = 'MA' | 'AE' | 'SA' | 'EG' | 'QA' | 'KW' | 'DZ' | 'TN' | 'JO' | 'LB' | 'BH' | 'OM'

export type JobType = 'full_time' | 'part_time' | 'contract' | 'remote' | 'hybrid' | 'internship'

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive'

export interface JobPosting {
  id:               string        // deterministic: `${source}_${hash(url)}`
  source:           JobSource
  title:            string        // in original language
  titleAr?:         string        // Arabic if source is English
  titleEn?:         string        // English if source is Arabic
  company:          string
  companyLogo?:     string
  location:         string
  locationAr?:      string
  country:          JobCountry
  jobType:          JobType
  experienceLevel?: ExperienceLevel
  experienceYears?: string        // e.g. "3-5 years"
  salaryMin?:       number        // in USD equivalent for comparison
  salaryMax?:       number
  salaryCurrency?:  string        // AED, SAR, EGP, MAD…
  salaryDisplay?:   string        // raw display string from source
  description:      string        // full text, may be HTML
  descriptionText?: string        // stripped plain text
  skills:           string[]      // extracted skill tags
  sector?:          string
  sectorAr?:        string
  applyUrl:         string
  postedAt:         Date
  expiresAt?:       Date
  isRemote:         boolean
  isUrgent:         boolean
  // AI match fields — populated by /api/jobs/match
  matchScore?:      number        // 0-100 vs user CV
  matchReasons?:    string[]      // why it matches
  missingSkills?:   string[]      // skills user lacks
  // User-specific state
  isSaved?:         boolean
}

export interface JobSearchParams {
  query?:    string
  country?:  JobCountry | 'ALL'
  sector?:   string
  jobType?:  JobType | 'ALL'
  remote?:   boolean
  page?:     number
  limit?:    number
  sources?:  JobSource[]
  lang?:     'ar' | 'en' | 'all'
  fresh?:    boolean     // last 7 days only
}

export interface JobSearchResult {
  jobs:       JobPosting[]
  total:      number
  page:       number
  hasMore:    boolean
  sources:    { source: JobSource; count: number; lastFetch: Date }[]
  cacheAge:   number   // seconds since last full refresh
}

export interface JobMatchRequest {
  jobId:   string
  jobData: JobPosting
  cvData:  Record<string, unknown>
}

export interface JobMatchResult {
  jobId:        string
  score:        number      // 0-100
  reasons:      string[]    // "Your React experience matches required skills"
  missingSkills: string[]   // "TypeScript", "AWS"
  suggestions:  string[]    // "Add AWS certification to your CV"
  timeToApply:  'apply_now' | 'strengthen_first' | 'not_a_fit'
}

// Sector taxonomy for MENA market
export const MENA_SECTORS = [
  { id: 'tech',        labelAr: 'التكنولوجيا',          labelEn: 'Technology' },
  { id: 'finance',     labelAr: 'المالية والمصرفية',     labelEn: 'Finance & Banking' },
  { id: 'oil_gas',     labelAr: 'النفط والغاز',          labelEn: 'Oil & Gas' },
  { id: 'construction',labelAr: 'الهندسة والبناء',       labelEn: 'Engineering & Construction' },
  { id: 'healthcare',  labelAr: 'الرعاية الصحية',        labelEn: 'Healthcare' },
  { id: 'education',   labelAr: 'التعليم',               labelEn: 'Education' },
  { id: 'retail',      labelAr: 'التجزئة والتجارة',      labelEn: 'Retail & Commerce' },
  { id: 'marketing',   labelAr: 'التسويق والإعلام',      labelEn: 'Marketing & Media' },
  { id: 'consulting',  labelAr: 'الاستشارات',            labelEn: 'Consulting' },
  { id: 'hospitality', labelAr: 'الضيافة والسياحة',      labelEn: 'Hospitality & Tourism' },
  { id: 'logistics',   labelAr: 'اللوجستيات والنقل',     labelEn: 'Logistics & Transport' },
  { id: 'government',  labelAr: 'القطاع الحكومي',        labelEn: 'Government & Public Sector' },
  { id: 'startup',     labelAr: 'الشركات الناشئة',       labelEn: 'Startups' },
  { id: 'ecommerce',   labelAr: 'التجارة الإلكترونية',   labelEn: 'E-Commerce' },
  { id: 'real_estate', labelAr: 'العقارات',              labelEn: 'Real Estate' },
] as const

export const COUNTRY_META: Record<JobCountry, { flag: string; labelAr: string; labelEn: string; currency: string }> = {
  AE: { flag: '🇦🇪', labelAr: 'الإمارات',   labelEn: 'UAE',           currency: 'AED' },
  SA: { flag: '🇸🇦', labelAr: 'السعودية',   labelEn: 'Saudi Arabia',  currency: 'SAR' },
  EG: { flag: '🇪🇬', labelAr: 'مصر',        labelEn: 'Egypt',         currency: 'EGP' },
  MA: { flag: '🇲🇦', labelAr: 'المغرب',     labelEn: 'Morocco',       currency: 'MAD' },
  QA: { flag: '🇶🇦', labelAr: 'قطر',        labelEn: 'Qatar',         currency: 'QAR' },
  KW: { flag: '🇰🇼', labelAr: 'الكويت',     labelEn: 'Kuwait',        currency: 'KWD' },
  DZ: { flag: '🇩🇿', labelAr: 'الجزائر',    labelEn: 'Algeria',       currency: 'DZD' },
  TN: { flag: '🇹🇳', labelAr: 'تونس',       labelEn: 'Tunisia',       currency: 'TND' },
  JO: { flag: '🇯🇴', labelAr: 'الأردن',     labelEn: 'Jordan',        currency: 'JOD' },
  LB: { flag: '🇱🇧', labelAr: 'لبنان',      labelEn: 'Lebanon',       currency: 'USD' },
  BH: { flag: '🇧🇭', labelAr: 'البحرين',    labelEn: 'Bahrain',       currency: 'BHD' },
  OM: { flag: '🇴🇲', labelAr: 'عُمان',      labelEn: 'Oman',          currency: 'OMR' },
}
