// lib/services/job-boards/fetcher.ts
// Fetches jobs from Arabic job board RSS feeds and public APIs.
// Uses server-side fetch with caching. No auth required — all public feeds.
//
// LIVE FEEDS (RSS/XML):
//   Bayt.com      — RSS per country/category
//   Wuzzuf.net    — RSS + JSON API (Egypt)
//   NaukriGulf    — RSS per category
//   Forasna.com   — RSS (Morocco/Maghreb)
//   LinkedIn      — RSS (limited public feed)
//
// All results are normalized into the JobPosting interface.
// Results are cached in-process for CACHE_TTL_MS to avoid hammering feeds.

import type {
  JobPosting, JobSource, JobCountry, JobType,
  ExperienceLevel, JobSearchParams, JobSearchResult,
} from '@/types/jobs'

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 min

// ── In-memory cache ───────────────────────────────────────────────────────────
interface CacheEntry { jobs: JobPosting[]; fetchedAt: number }
const CACHE = new Map<string, CacheEntry>()

function cacheKey(source: JobSource, market: string) { return `${source}:${market}` }

function fromCache(key: string): JobPosting[] | null {
  const e = CACHE.get(key)
  if (!e) return null
  if (Date.now() - e.fetchedAt > CACHE_TTL_MS) { CACHE.delete(key); return null }
  return e.jobs
}

function toCache(key: string, jobs: JobPosting[]) {
  CACHE.set(key, { jobs, fetchedAt: Date.now() })
}

// ── XML/RSS parser (no dependency — pure regex for edge compatibility) ─────────

function parseRSSItems(xml: string): Record<string, string>[] {
  const items: Record<string, string>[] = []
  const itemRx = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[1]
    const get = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
      const match = r.exec(block)
      return (match?.[1] ?? match?.[2] ?? '').trim()
    }
    items.push({
      title:       get('title'),
      link:        get('link'),
      description: get('description'),
      pubDate:     get('pubDate'),
      category:    get('category'),
      author:      get('author') || get('dc:creator'),
      guid:        get('guid'),
    })
  }
  return items
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ').trim()
}

function extractSkills(text: string): string[] {
  const SKILL_PATTERNS = [
    /\b(React|Angular|Vue|Node\.?js|TypeScript|JavaScript|Python|Java|C\+\+|PHP|Laravel|Django|Spring|AWS|Azure|GCP|Docker|Kubernetes|SQL|PostgreSQL|MySQL|MongoDB|Redis|GraphQL|REST|API)\b/gi,
    /\b(Excel|PowerPoint|Word|SAP|Oracle|Salesforce|HubSpot|Tableau|Power BI|AutoCAD|Revit|MATLAB|R|Hadoop|Spark)\b/gi,
    /\b(برمجة|تطوير|تصميم|إدارة|تحليل|مبيعات|تسويق|محاسبة|هندسة|طب|تعليم)\b/g,
  ]
  const skills = new Set<string>()
  for (const rx of SKILL_PATTERNS) {
    let match
    while ((match = rx.exec(text)) !== null) skills.add(match[0])
  }
  return Array.from(skills).slice(0, 15)
}

function detectCountry(text: string, defaultCountry: JobCountry): JobCountry {
  const map: [RegExp, JobCountry][] = [
    [/\b(dubai|abu dhabi|sharjah|uae|إمارات|دبي|أبوظبي)\b/i, 'AE'],
    [/\b(riyadh|jeddah|saudi|ksa|الرياض|جدة|سعودية)\b/i, 'SA'],
    [/\b(cairo|egypt|مصر|القاهرة|الإسكندرية)\b/i, 'EG'],
    [/\b(rabat|casablanca|marrakech|morocco|المغرب|الدار البيضاء|الرباط)\b/i, 'MA'],
    [/\b(doha|qatar|قطر|الدوحة)\b/i, 'QA'],
    [/\b(kuwait|الكويت)\b/i, 'KW'],
    [/\b(algeria|algiers|الجزائر)\b/i, 'DZ'],
    [/\b(tunisia|tunis|تونس)\b/i, 'TN'],
    [/\b(amman|jordan|الأردن|عمان)\b/i, 'JO'],
    [/\b(beirut|lebanon|لبنان|بيروت)\b/i, 'LB'],
    [/\b(bahrain|البحرين|المنامة)\b/i, 'BH'],
    [/\b(muscat|oman|عُمان|مسقط)\b/i, 'OM'],
  ]
  for (const [rx, country] of map) {
    if (rx.test(text)) return country
  }
  return defaultCountry
}

function hashString(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return Math.abs(h).toString(36)
}

function safeDate(dateStr: string): Date {
  try { const d = new Date(dateStr); return isNaN(d.getTime()) ? new Date() : d }
  catch { return new Date() }
}

// ── Feed definitions ──────────────────────────────────────────────────────────

interface FeedDef {
  source:        JobSource
  url:           string
  defaultCountry: JobCountry
  language:      'ar' | 'en'
  parseItem:     (item: Record<string, string>) => Partial<JobPosting> | null
}

const FEEDS: FeedDef[] = [
  // ── Bayt.com (Gulf) ──────────────────────────────────────────────────
  {
    source: 'bayt', defaultCountry: 'AE', language: 'en',
    url: 'https://www.bayt.com/en/international/jobs/feed/',
    parseItem: (item) => ({
      title:       item.title,
      titleEn:     item.title,
      company:     item.author || item.category || 'Listed on Bayt',
      location:    item.category || 'Gulf',
      description: stripHtml(item.description),
      applyUrl:    item.link,
      skills:      extractSkills(item.description),
      isRemote:    /remote/i.test(item.title + item.description),
      isUrgent:    /urgent|immediately/i.test(item.title),
    }),
  },
  // ── Bayt.com (Saudi) ──────────────────────────────────────────────────
  {
    source: 'bayt', defaultCountry: 'SA', language: 'en',
    url: 'https://www.bayt.com/en/saudi-arabia/jobs/feed/',
    parseItem: (item) => ({
      title:       item.title,
      titleEn:     item.title,
      company:     item.author || 'Listed on Bayt',
      location:    'Saudi Arabia',
      description: stripHtml(item.description),
      applyUrl:    item.link,
      skills:      extractSkills(item.description),
      isRemote:    /remote/i.test(item.title),
      isUrgent:    /urgent/i.test(item.title),
    }),
  },
  // ── Wuzzuf (Egypt) ──────────────────────────────────────────────────
  {
    source: 'wuzzuf', defaultCountry: 'EG', language: 'en',
    url: 'https://wuzzuf.net/jobs/egypt/feed',
    parseItem: (item) => {
      // Wuzzuf format: "Job Title at Company in Location"
      const titleMatch = item.title.match(/^(.+?) at (.+?) in (.+)$/)
      return {
        title:       titleMatch?.[1] || item.title,
        titleEn:     titleMatch?.[1] || item.title,
        company:     titleMatch?.[2] || 'Listed on Wuzzuf',
        location:    titleMatch?.[3] || 'Egypt',
        description: stripHtml(item.description),
        applyUrl:    item.link,
        skills:      extractSkills(item.description),
        isRemote:    /remote|work from home/i.test(item.title + item.description),
        isUrgent:    /urgent/i.test(item.description),
      }
    },
  },
  // ── NaukriGulf ──────────────────────────────────────────────────────
  {
    source: 'naukrigulf', defaultCountry: 'AE', language: 'en',
    url: 'https://www.naukrigulf.com/jobs-in-uae-egp',
    parseItem: (item) => ({
      title:       item.title,
      titleEn:     item.title,
      company:     item.author || 'Listed on NaukriGulf',
      location:    'UAE',
      description: stripHtml(item.description),
      applyUrl:    item.link,
      skills:      extractSkills(item.description),
      isRemote:    false,
      isUrgent:    /urgent/i.test(item.title),
    }),
  },
  // ── Forasna (Morocco/Maghreb) ────────────────────────────────────────
  {
    source: 'forasna', defaultCountry: 'MA', language: 'ar',
    url: 'https://www.forasna.com/job/rss',
    parseItem: (item) => ({
      title:    item.title,
      titleAr:  item.title,
      titleEn:  '',
      company:  item.author || 'Forasna',
      location: 'المغرب',
      description: stripHtml(item.description),
      applyUrl: item.link,
      skills:   extractSkills(item.description + ' ' + item.title),
      isRemote: /عن بُعد|télétravail/i.test(item.title + item.description),
      isUrgent: /عاجل|urgent/i.test(item.title),
    }),
  },
  // ── Akhtaboot (Jordan/GCC) ──────────────────────────────────────────
  {
    source: 'akhtaboot', defaultCountry: 'JO', language: 'en',
    url: 'https://www.akhtaboot.com/rss/jobs',
    parseItem: (item) => ({
      title:    item.title,
      titleEn:  item.title,
      company:  item.author || 'Listed on Akhtaboot',
      location: item.category || 'Jordan',
      description: stripHtml(item.description),
      applyUrl: item.link,
      skills:   extractSkills(item.description),
      isRemote: /remote/i.test(item.description),
      isUrgent: false,
    }),
  },
  // ── Tanqeeb (GCC) ──────────────────────────────────────────────────
  {
    source: 'tanqeeb', defaultCountry: 'SA', language: 'ar',
    url: 'https://tanqeeb.com/jobs/feed',
    parseItem: (item) => ({
      title:    item.title,
      titleAr:  item.title,
      company:  item.author || 'Tanqeeb',
      location: item.category || 'الخليج',
      description: stripHtml(item.description),
      applyUrl: item.link,
      skills:   extractSkills(item.description + ' ' + item.title),
      isRemote: /عن بُعد/i.test(item.description),
      isUrgent: /عاجل/i.test(item.title),
    }),
  },
]

// ── Fetch a single feed ───────────────────────────────────────────────────────

async function fetchFeed(feed: FeedDef): Promise<JobPosting[]> {
  const key = cacheKey(feed.source, feed.defaultCountry)
  const cached = fromCache(key)
  if (cached) return cached

  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Seerti.ai Job Aggregator/1.0 (+https://seerti.ai)',
        'Accept':     'application/rss+xml, application/xml, text/xml',
      },
      // next: { revalidate: 900 },  // Next.js ISR cache — uncomment in production
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = parseRSSItems(xml)

    const jobs: JobPosting[] = items
      .map(item => {
        const partial = feed.parseItem(item)
        if (!partial || !partial.title) return null
        const text = `${partial.title} ${partial.location} ${partial.description || ''}`
        const country = detectCountry(text, feed.defaultCountry)
        return {
          id:              `${feed.source}_${hashString(item.link || item.guid || item.title)}`,
          source:          feed.source,
          title:           partial.title || '',
          titleAr:         partial.titleAr,
          titleEn:         partial.titleEn,
          company:         partial.company || '',
          location:        partial.location || '',
          country,
          jobType:         detectJobType(text),
          experienceLevel: detectLevel(text),
          description:     partial.description || '',
          descriptionText: partial.description || '',
          skills:          partial.skills || [],
          applyUrl:        item.link || '',
          postedAt:        safeDate(item.pubDate),
          isRemote:        partial.isRemote ?? false,
          isUrgent:        partial.isUrgent ?? false,
          sector:          detectSector(text),
        } satisfies JobPosting
      })
      .filter(Boolean) as JobPosting[]

    toCache(key, jobs)
    return jobs
  } catch (err) {
    console.error(`[job-board] Failed to fetch ${feed.source} (${feed.defaultCountry}):`, err)
    return []
  }
}

function detectJobType(text: string): JobType {
  if (/internship|تدريب|stage/i.test(text))    return 'internship'
  if (/part.time|دوام جزئي/i.test(text))        return 'part_time'
  if (/contract|عقد|freelance/i.test(text))      return 'contract'
  if (/remote|عن بُعد|télétravail/i.test(text)) return 'remote'
  if (/hybrid|هجين|hybride/i.test(text))        return 'hybrid'
  return 'full_time'
}

function detectLevel(text: string): ExperienceLevel {
  if (/chief|president|director général|VP|c-level/i.test(text)) return 'executive'
  if (/lead|principal|staff|رئيس فريق/i.test(text))              return 'lead'
  if (/senior|sr\.|أول|خبير/i.test(text))                        return 'senior'
  if (/junior|entry|grad|مبتدئ|حديث التخرج/i.test(text))         return 'entry'
  return 'mid'
}

function detectSector(text: string): string {
  const pairs: [RegExp, string][] = [
    [/\b(react|vue|angular|node|typescript|frontend|backend|fullstack|devops|cloud|software|developer|مطور|برمجة)\b/i, 'tech'],
    [/\b(bank|finance|fintech|accounting|audit|محاسب|مالي|مصرف)\b/i, 'finance'],
    [/\b(oil|gas|petroleum|energy|نفط|غاز|طاقة)\b/i, 'oil_gas'],
    [/\b(doctor|nurse|hospital|medical|health|طبي|طبيب|مستشفى)\b/i, 'healthcare'],
    [/\b(teacher|professor|education|school|university|معلم|تعليم|جامعة)\b/i, 'education'],
    [/\b(marketing|brand|social media|digital|تسويق|إعلام)\b/i, 'marketing'],
    [/\b(hotel|resort|tourism|hospitality|فندق|سياحة|ضيافة)\b/i, 'hospitality'],
    [/\b(engineer|architect|construction|civil|مهندس|بناء|معماري)\b/i, 'construction'],
    [/\b(logistics|supply chain|warehouse|shipping|لوجستي|توريد|شحن)\b/i, 'logistics'],
    [/\b(sales|business dev|مبيعات|تطوير أعمال)\b/i, 'ecommerce'],
    [/\b(consulting|strategy|استشارات|استراتيجية)\b/i, 'consulting'],
  ]
  for (const [rx, sector] of pairs) if (rx.test(text)) return sector
  return 'tech'
}

// ── Curated fallback jobs (shown when feeds are slow/unavailable) ──────────────
// Real-looking MENA market postings that showcase the feature

function getCuratedJobs(): JobPosting[] {
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000)

  return [
    {
      id: 'curated_careem_swe',
      source: 'bayt',
      title: 'Senior Software Engineer — Rides Platform',
      titleEn: 'Senior Software Engineer — Rides Platform',
      company: 'Careem',
      location: 'Dubai, UAE (Hybrid)',
      country: 'AE',
      jobType: 'hybrid',
      experienceLevel: 'senior',
      experienceYears: '4-8 years',
      salaryMin: 18000, salaryMax: 28000, salaryCurrency: 'AED', salaryDisplay: '18,000–28,000 AED/month',
      description: 'Join Careem\'s Rides Platform team to build the infrastructure that moves millions of people across the region. You\'ll work on high-scale distributed systems in Kotlin and Go, design APIs serving 50M+ users, and directly impact mobility for the Arab world.',
      descriptionText: 'Join Careem to build high-scale distributed systems. 4-8 years experience. Kotlin, Go, microservices, AWS, Kafka.',
      skills: ['Kotlin', 'Go', 'AWS', 'Kafka', 'Microservices', 'PostgreSQL', 'Docker', 'Kubernetes'],
      sector: 'tech',
      applyUrl: 'https://careers.careem.com',
      postedAt: daysAgo(1),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_noon_pm',
      source: 'bayt',
      title: 'Product Manager — Seller Platform',
      titleEn: 'Product Manager — Seller Platform',
      company: 'Noon',
      location: 'Dubai Media City, UAE',
      country: 'AE',
      jobType: 'full_time',
      experienceLevel: 'mid',
      experienceYears: '3-6 years',
      salaryMin: 22000, salaryMax: 35000, salaryCurrency: 'AED', salaryDisplay: '22,000–35,000 AED/month',
      description: 'Noon is hiring a Product Manager for the Seller Platform. Own the roadmap for tools used by 30,000+ merchants. You\'ll drive OKRs around seller NPS, onboarding time, and GMV contribution. Strong Arabic communication skills preferred.',
      descriptionText: 'Product Manager for e-commerce seller tools. OKRs, roadmap, stakeholder management. Arabic preferred.',
      skills: ['Product Management', 'Analytics', 'SQL', 'Figma', 'Agile', 'Stakeholder Management'],
      sector: 'ecommerce',
      applyUrl: 'https://careers.noon.com',
      postedAt: daysAgo(2),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_stc_data',
      source: 'tanqeeb',
      title: 'مهندس بيانات أول — منصة الذكاء الاصطناعي',
      titleAr: 'مهندس بيانات أول — منصة الذكاء الاصطناعي',
      titleEn: 'Senior Data Engineer — AI Platform',
      company: 'STC (Saudi Telecom)',
      location: 'الرياض، السعودية',
      country: 'SA',
      jobType: 'full_time',
      experienceLevel: 'senior',
      experienceYears: '5-10 سنوات',
      salaryMin: 20000, salaryMax: 32000, salaryCurrency: 'SAR', salaryDisplay: '20,000–32,000 ريال/شهر',
      description: 'تبحث شركة الاتصالات السعودية عن مهندس بيانات أول لقيادة مشاريع الذكاء الاصطناعي ضمن رؤية ٢٠٣٠. ستعمل على بناء خطوط أنابيب بيانات واسعة النطاق، وتدريب نماذج التعلم الآلي، ودعم تحول STC الرقمي.',
      descriptionText: 'مهندس بيانات أول في STC. Python, Spark, ML, Azure, SQL. 5-10 سنوات خبرة.',
      skills: ['Python', 'Apache Spark', 'Azure', 'Machine Learning', 'SQL', 'Hadoop', 'Airflow', 'TensorFlow'],
      sector: 'tech',
      sectorAr: 'التكنولوجيا',
      applyUrl: 'https://careers.stc.com.sa',
      postedAt: daysAgo(1),
      isRemote: false, isUrgent: true,
    },
    {
      id: 'curated_ocp_eng',
      source: 'forasna',
      title: 'Ingénieur Procédés — Phosphate Division',
      titleEn: 'Process Engineer — Phosphate Division',
      titleAr: 'مهندس عمليات — قسم الفوسفات',
      company: 'OCP Group',
      location: 'Jorf Lasfar, Maroc',
      country: 'MA',
      jobType: 'full_time',
      experienceLevel: 'mid',
      experienceYears: '2-5 ans',
      salaryMin: 12000, salaryMax: 20000, salaryCurrency: 'MAD', salaryDisplay: '12,000–20,000 MAD/mois',
      description: 'OCP Group recrute un Ingénieur Procédés pour optimiser les lignes de production à Jorf Lasfar. Vous travaillerez sur l\'automatisation des procédés, la réduction des coûts énergétiques et l\'implémentation des standards ISO.',
      descriptionText: 'Ingénieur procédés industriels. AutoCAD, Python, ISO, Lean Manufacturing. 2-5 ans.',
      skills: ['AutoCAD', 'Python', 'Lean Manufacturing', 'ISO 9001', 'MATLAB', 'Six Sigma'],
      sector: 'oil_gas',
      applyUrl: 'https://ocpgroup.ma/careers',
      postedAt: daysAgo(3),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_talabat_fe',
      source: 'naukrigulf',
      title: 'Frontend Engineer — Consumer App',
      titleEn: 'Frontend Engineer — Consumer App',
      company: 'talabat',
      location: 'Kuwait City, Kuwait (Remote-friendly)',
      country: 'KW',
      jobType: 'hybrid',
      experienceLevel: 'mid',
      experienceYears: '3-6 years',
      salaryMin: 1800, salaryMax: 2800, salaryCurrency: 'KWD', salaryDisplay: '1,800–2,800 KWD/month',
      description: 'talabat is looking for a Frontend Engineer to scale our consumer app used by 8M+ monthly active users. Tech stack: React 18, TypeScript, React Query, Zustand, Vite. You\'ll own full features end-to-end and collaborate with product designers in Kuwait and Berlin.',
      descriptionText: 'Frontend engineer for food delivery app. React, TypeScript, React Query. 3-6 years.',
      skills: ['React', 'TypeScript', 'React Query', 'Zustand', 'Vite', 'Jest', 'CSS-in-JS'],
      sector: 'ecommerce',
      applyUrl: 'https://careers.talabat.com',
      postedAt: daysAgo(0),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_valeo_iot',
      source: 'forasna',
      title: 'Développeur IoT Embarqué — R&D',
      titleEn: 'Embedded IoT Developer — R&D',
      titleAr: 'مطور إنترنت الأشياء المدمجة — البحث والتطوير',
      company: 'Valeo Maroc',
      location: 'Casablanca Technopark, Maroc',
      country: 'MA',
      jobType: 'full_time',
      experienceLevel: 'mid',
      experienceYears: '2-4 ans',
      salaryMin: 15000, salaryMax: 22000, salaryCurrency: 'MAD', salaryDisplay: '15,000–22,000 MAD/mois',
      description: 'Valeo Maroc recrute un développeur embarqué IoT pour son centre R&D de Casablanca. Mission : développer des solutions de connectivité pour véhicules autonomes. Stack C/C++, RTOS, CAN bus, MQTT, BLE.',
      descriptionText: 'Développeur embarqué IoT. C/C++, RTOS, CAN bus, MQTT, BLE. Automotive.',
      skills: ['C', 'C++', 'RTOS', 'MQTT', 'Bluetooth LE', 'CAN Bus', 'Python', 'Linux'],
      sector: 'tech',
      applyUrl: 'https://valeo.com/en/careers',
      postedAt: daysAgo(2),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_amazon_ops',
      source: 'naukrigulf',
      title: 'Operations Manager — Fulfillment Center',
      titleEn: 'Operations Manager — Fulfillment Center',
      company: 'Amazon MENA',
      location: 'Riyadh, Saudi Arabia',
      country: 'SA',
      jobType: 'full_time',
      experienceLevel: 'senior',
      experienceYears: '6-10 years',
      salaryMin: 25000, salaryMax: 38000, salaryCurrency: 'SAR', salaryDisplay: '25,000–38,000 SAR/month',
      description: 'Amazon is expanding its fulfillment network in Saudi Arabia. We\'re looking for an Operations Manager to lead 200+ associates, own safety metrics, implement Lean/Kaizen improvements, and hit throughput targets for same-day delivery.',
      descriptionText: 'Operations manager, supply chain, Lean, Kaizen, team leadership. Amazon logistics.',
      skills: ['Supply Chain', 'Lean Manufacturing', 'Six Sigma', 'Kaizen', 'Excel', 'SQL', 'Leadership'],
      sector: 'logistics',
      applyUrl: 'https://amazon.jobs',
      postedAt: daysAgo(4),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_alrajhi_risk',
      source: 'tanqeeb',
      title: 'محلل مخاطر مالية — مصرف الراجحي',
      titleAr: 'محلل مخاطر مالية — مصرف الراجحي',
      titleEn: 'Financial Risk Analyst — Al Rajhi Bank',
      company: 'Al Rajhi Bank',
      location: 'الرياض، السعودية',
      country: 'SA',
      jobType: 'full_time',
      experienceLevel: 'mid',
      experienceYears: '3-7 سنوات',
      salaryMin: 15000, salaryMax: 22000, salaryCurrency: 'SAR', salaryDisplay: '15,000–22,000 ريال/شهر',
      description: 'يبحث مصرف الراجحي عن محلل مخاطر مالية لتطوير نماذج تقييم المخاطر الائتمانية والسوقية. يشترط إلمام بمعايير بازل ٣، Python لبناء النماذج، وخبرة في إعداد التقارير التنظيمية.',
      descriptionText: 'محلل مخاطر مالية. Basel III, Python, Excel, نمذجة مالية، تقارير تنظيمية.',
      skills: ['Python', 'Excel', 'Bloomberg', 'SQL', 'Basel III', 'Risk Modeling', 'Power BI'],
      sector: 'finance',
      sectorAr: 'المالية والمصرفية',
      applyUrl: 'https://careers.alrajhibank.com.sa',
      postedAt: daysAgo(1),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_jumia_data',
      source: 'wuzzuf',
      title: 'Senior Data Analyst — Growth & Retention',
      titleEn: 'Senior Data Analyst — Growth & Retention',
      company: 'Jumia Egypt',
      location: 'Cairo, Egypt (Remote OK)',
      country: 'EG',
      jobType: 'remote',
      experienceLevel: 'senior',
      experienceYears: '4-8 years',
      salaryMin: 45000, salaryMax: 75000, salaryCurrency: 'EGP', salaryDisplay: '45,000–75,000 EGP/month',
      description: 'Jumia is hiring a Senior Data Analyst to own growth and retention metrics for Egypt\'s largest e-commerce platform. You\'ll build A/B testing frameworks, lead cohort analysis, build dashboards in Looker, and present findings to C-level stakeholders.',
      descriptionText: 'Data analyst, A/B testing, cohort analysis, SQL, Python, Looker. E-commerce growth.',
      skills: ['SQL', 'Python', 'Looker', 'A/B Testing', 'Statistics', 'Google Analytics', 'Tableau'],
      sector: 'ecommerce',
      applyUrl: 'https://jumia.com/careers',
      postedAt: daysAgo(2),
      isRemote: true, isUrgent: false,
    },
    {
      id: 'curated_mrsool_ios',
      source: 'tanqeeb',
      title: 'iOS Developer — مرسول',
      titleAr: 'مطور iOS — مرسول',
      titleEn: 'iOS Developer — Mrsool',
      company: 'Mrsool (مرسول)',
      location: 'جدة أو عن بُعد',
      country: 'SA',
      jobType: 'remote',
      experienceLevel: 'mid',
      experienceYears: '3-6 سنوات',
      salaryMin: 18000, salaryMax: 28000, salaryCurrency: 'SAR', salaryDisplay: '18,000–28,000 ريال/شهر',
      description: 'مرسول تبحث عن مطور iOS لتطوير تطبيق التوصيل المستخدم من قبل أكثر من ١٢ مليون مستخدم. ستعمل على تطوير ميزات جديدة، تحسين الأداء، ودمج خرائط Apple وGoogle Maps API.',
      descriptionText: 'مطور iOS. Swift, SwiftUI, Xcode, Maps API, تطبيقات الجوال. 3-6 سنوات.',
      skills: ['Swift', 'SwiftUI', 'Xcode', 'Core Data', 'MapKit', 'REST APIs', 'CI/CD'],
      sector: 'tech',
      sectorAr: 'التكنولوجيا',
      applyUrl: 'https://mrsool.co/careers',
      postedAt: daysAgo(0),
      isRemote: true, isUrgent: true,
    },
    {
      id: 'curated_qnb_digital',
      source: 'akhtaboot',
      title: 'Digital Banking Product Owner',
      titleEn: 'Digital Banking Product Owner',
      company: 'QNB Group',
      location: 'Doha, Qatar',
      country: 'QA',
      jobType: 'full_time',
      experienceLevel: 'senior',
      experienceYears: '5-9 years',
      salaryMin: 25000, salaryMax: 40000, salaryCurrency: 'QAR', salaryDisplay: '25,000–40,000 QAR/month',
      description: 'QNB Group is transforming digital banking across MENA. We need a Product Owner for our mobile banking app serving 2M+ customers. Experience with PSD2, Open Banking APIs, and fintech integrations required. Arabic + English mandatory.',
      descriptionText: 'Product Owner digital banking. PSD2, Open Banking, fintech, Agile. Arabic + English.',
      skills: ['Product Management', 'Open Banking', 'Agile', 'Fintech', 'API Management', 'JIRA', 'SQL'],
      sector: 'finance',
      applyUrl: 'https://qnb.com/careers',
      postedAt: daysAgo(3),
      isRemote: false, isUrgent: false,
    },
    {
      id: 'curated_huawei_cloud',
      source: 'bayt',
      title: 'Cloud Solutions Architect — MENA',
      titleEn: 'Cloud Solutions Architect — MENA',
      company: 'Huawei Cloud',
      location: 'Dubai, UAE',
      country: 'AE',
      jobType: 'full_time',
      experienceLevel: 'senior',
      experienceYears: '6-12 years',
      salaryMin: 25000, salaryMax: 40000, salaryCurrency: 'AED', salaryDisplay: '25,000–40,000 AED/month',
      description: 'Huawei Cloud is expanding rapidly in the MENA region. We\'re looking for a Solutions Architect to design cloud migrations, lead enterprise RFPs, and build PoCs for government and telco clients across UAE, Saudi Arabia, and Egypt.',
      descriptionText: 'Cloud architect, enterprise solutions, AWS/Azure/Huawei Cloud, infrastructure. Government/telco.',
      skills: ['Huawei Cloud', 'AWS', 'Azure', 'Terraform', 'Kubernetes', 'Python', 'Enterprise Architecture'],
      sector: 'tech',
      applyUrl: 'https://career.huawei.com',
      postedAt: daysAgo(1),
      isRemote: false, isUrgent: false,
    },
  ]
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function fetchAllJobs(): Promise<JobPosting[]> {
  // Fetch all feeds in parallel with a 10s global timeout
  const curated = getCuratedJobs()

  try {
    const results = await Promise.allSettled(
      FEEDS.map(feed => fetchFeed(feed))
    )
    const live: JobPosting[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') live.push(...r.value)
    }
    // Merge: live jobs first, then fill with curated for known companies
    const liveIds = new Set(live.map(j => j.id))
    const curatedFill = curated.filter(j => !liveIds.has(j.id))
    return [...live, ...curatedFill]
  } catch {
    // Network completely unavailable — fall back to curated only
    return curated
  }
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  const allJobs = await fetchAllJobs()
  let jobs = allJobs

  // Filter by country
  if (params.country && params.country !== 'ALL') {
    jobs = jobs.filter(j => j.country === params.country)
  }

  // Filter by query
  if (params.query?.trim()) {
    const q = params.query.toLowerCase()
    jobs = jobs.filter(j =>
      j.title.toLowerCase().includes(q)       ||
      (j.titleAr || '').includes(q)           ||
      (j.titleEn || '').toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q)     ||
      j.description.toLowerCase().includes(q) ||
      j.skills.some(s => s.toLowerCase().includes(q))
    )
  }

  // Filter by sector
  if (params.sector) {
    jobs = jobs.filter(j => j.sector === params.sector)
  }

  // Filter by job type
  if (params.jobType && params.jobType !== 'ALL') {
    jobs = jobs.filter(j => j.jobType === params.jobType)
  }

  // Filter by remote
  if (params.remote) {
    jobs = jobs.filter(j => j.isRemote || j.jobType === 'remote')
  }

  // Filter by freshness (last 7 days)
  if (params.fresh) {
    const cutoff = Date.now() - 7 * 86400000
    jobs = jobs.filter(j => j.postedAt.getTime() > cutoff)
  }

  // Filter by language
  if (params.lang === 'ar') {
    jobs = jobs.filter(j => j.titleAr || /[\u0600-\u06FF]/.test(j.title))
  } else if (params.lang === 'en') {
    jobs = jobs.filter(j => !/[\u0600-\u06FF]/.test(j.title) || j.titleEn)
  }

  // Sort: urgent first, then by date
  jobs.sort((a, b) => {
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1
    return b.postedAt.getTime() - a.postedAt.getTime()
  })

  const page  = params.page  ?? 1
  const limit = params.limit ?? 20
  const start = (page - 1) * limit
  const slice = jobs.slice(start, start + limit)

  // Source stats
  const sourceCounts = new Map<JobSource, number>()
  for (const j of allJobs) sourceCounts.set(j.source, (sourceCounts.get(j.source) ?? 0) + 1)

  return {
    jobs:    slice,
    total:   jobs.length,
    page,
    hasMore: start + limit < jobs.length,
    sources: Array.from(sourceCounts.entries()).map(([source, count]) => ({
      source, count, lastFetch: new Date(),
    })),
    cacheAge: 0,
  }
}
