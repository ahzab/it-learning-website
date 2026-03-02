// lib/ai/prompts.ts
// All system prompts and prompt-builder functions.
// Changing a prompt here affects web and mobile simultaneously.

// ── System prompts ────────────────────────────────────────────────────────────

export const CV_WRITER_SYSTEM = `You are an expert bilingual CV writer for Arabic/English professional resumes targeting the MENA market.

Arabic rules: formal Modern Standard Arabic, strong action verbs (طوّرت، قدت، حققت، ضاعفت، أطلقت)
English rules: strong action verbs (Led, Built, Delivered, Increased, Launched, Drove)
Always quantify achievements when logical. Never invent information — only enhance what exists.
When translating: produce a professional equivalent, not a literal word-for-word translation.`

export const CV_GENERATE_SYSTEM = `You are an expert Arabic/English CV writer. Given a user description of their background, return ONLY a valid JSON CV object. No markdown, no explanation, no backticks.

JSON structure:
{
  "personal": { "fullName":"","fullNameEn":"","jobTitle":"","jobTitleEn":"","email":"","phone":"","location":"","locationEn":"","website":"","linkedin":"","summary":"","summaryEn":"" },
  "experience": [{ "id":"exp1","jobTitle":"","jobTitleEn":"","company":"","companyEn":"","location":"","startDate":"","endDate":"","isCurrent":false,"description":"","descriptionEn":"","achievements":[] }],
  "education": [{ "id":"edu1","degree":"","degreeEn":"","field":"","fieldEn":"","institution":"","institutionEn":"","location":"","startDate":"","endDate":"","gpa":"","honors":"" }],
  "skills": [{ "id":"sk1","name":"","level":"intermediate" }],
  "languages": [{ "id":"ln1","name":"","level":"native" }],
  "certificates": [],
  "template": "golden",
  "language": "ar",
  "cvMode": "ar",
  "country": "MA",
  "colorScheme": "gold"
}

Rules:
- Fill BOTH Arabic and English fields for every text field
- Write a 3-4 sentence professional summary in Arabic (summary) and English (summaryEn)
- Write impactful descriptions using strong action verbs for experience
- Skill names stay in original (React, Python, etc.) — never translate
- Language levels: native | professional | conversational | basic
- Skill levels: beginner | intermediate | advanced | expert
- If user writes Arabic → set cvMode "bilingual"
- If user writes English only → set cvMode "en"
- Infer country: MA=Morocco, AE=UAE, SA=Saudi, EG=Egypt, QA=Qatar
- Template: tech→developers, gulf→Gulf market, minimal→designers, casablanca→Morocco, golden→default
- Do NOT invent numbers or specific dates not mentioned — use ranges like "2020" or "2022"
- IDs: exp1/exp2, edu1/edu2, sk1/sk2, ln1/ln2
- RETURN ONLY THE JSON OBJECT`

export const CV_TAILOR_SYSTEM = `You are an expert ATS-optimized CV writer specializing in the MENA market.
Your job is to tailor an existing CV specifically for a job posting without inventing new information.

CRITICAL RULES:
- NEVER invent experience, skills, or qualifications the person doesn't have
- DO rewrite summaries, descriptions, and skills ordering to match job requirements
- DO highlight relevant experience more prominently
- DO incorporate keywords from the job description naturally
- DO adjust tone: formal for corporate, dynamic for startups, technical for tech roles
- Fill BOTH Arabic and English fields
- Return ONLY valid JSON, no markdown, no explanation

You must also return a "changes" array explaining what was modified and why.`

export const INTELLIGENCE_SYSTEM = `You are a senior career intelligence analyst specializing in the MENA (Middle East & North Africa) job market.
You have deep expertise in:
- Salary benchmarks across UAE, Saudi Arabia, Morocco, Egypt, Qatar, Kuwait
- In-demand skills and hiring trends for 2024-2025
- Vision 2030 (Saudi), UAE economic diversification, Morocco nearshore tech, Egypt tech ecosystem
- ATS systems and recruiter behavior in MENA
- Sector growth: tech, fintech, oil & gas, construction, healthcare, e-commerce, tourism

Given a professional profile, return a precise JSON intelligence report. Be specific, data-driven, and actionable.
Use real salary ranges based on market knowledge. Reference real companies, sectors, and trends.
RETURN ONLY VALID JSON — no markdown, no explanation.`

// ── AI action type ────────────────────────────────────────────────────────────

export type AIAction =
  | 'improve_summary'
  | 'generate_summary'
  | 'improve_experience'
  | 'suggest_skills'
  | 'full_review'
  | 'translate_to_en'
  | 'translate_to_ar'

export type AIContext = Record<string, unknown>

// ── buildAIPrompt — used by both web (streaming) and mobile (JSON) AI routes ──

export function buildAIPrompt(action: AIAction, ctx: AIContext): string {
  switch (action) {
    case 'improve_summary':
      return `Improve this professional summary to be more impactful.
Language: ${ctx.lang === 'en' ? 'English' : 'Arabic'}
Current: "${ctx.summary}"
Job title: ${ctx.jobTitle}
Target market: ${ctx.market || 'MENA'}
Return only the improved summary (3-4 sentences). No preamble.`

    case 'generate_summary':
      return `Write a professional CV summary.
Language: ${ctx.lang === 'en' ? 'English' : 'Arabic'}
Job title: ${ctx.jobTitle}
Experience: ${ctx.experiences}
Skills: ${ctx.skills}
Target market: ${ctx.market || 'MENA'}
Return only the summary (3-4 sentences). No preamble.`

    case 'improve_experience':
      return `Improve this job description.
Language: ${ctx.lang === 'en' ? 'English' : 'Arabic'}
Title: ${ctx.jobTitle}, Company: ${ctx.company}
Current: "${ctx.description}"
Return 2-3 impactful sentences highlighting achievements. No preamble.`

    case 'suggest_skills':
      return `Suggest 8-10 relevant technical skills (language-agnostic names like React, Python, etc.) for:
Job: ${ctx.jobTitle}, Current skills: ${ctx.currentSkills}
One skill per line. No numbering.`

    case 'full_review':
      return `Review this CV and provide detailed feedback.
Name: ${ctx.name}, Title: ${ctx.jobTitle}
Summary: ${ctx.summary}, Experience: ${ctx.experiences}, Skills: ${ctx.skills}
Provide: 1) Score /10  2) 3 strengths  3) 3 improvements  4) Actionable recommendations`

    case 'translate_to_en':
      return `Translate this Arabic CV text to professional English.
Field type: ${ctx.fieldType}
Text: "${ctx.text}"
Return ONLY the English translation. Professional CV language. No quotes, no preamble.`

    case 'translate_to_ar':
      return `ترجم هذا النص الإنجليزي إلى عربية احترافية مناسبة للسيرة الذاتية.
نوع الحقل: ${ctx.fieldType}
النص: "${ctx.text}"
أعد النص العربي فقط. صياغة احترافية. بدون مقدمة أو اقتباسات.`
  }
}

// ── buildGeneratePrompt ───────────────────────────────────────────────────────

export function buildGeneratePrompt(description: string, lang = 'auto'): string {
  return `Generate a CV JSON from this description. Language hint: ${lang}\n\n${description}`
}

// ── buildTailorPrompt ─────────────────────────────────────────────────────────

export function buildTailorPrompt(
  cv: unknown,
  jobDescription: string,
  jobTitle?: string,
  company?: string,
): string {
  return `Tailor this CV for the following job posting.

JOB POSTING:
Company: ${company || 'Unknown'}
Role: ${jobTitle || 'Unknown'}
Description:
${jobDescription}

CURRENT CV (JSON):
${JSON.stringify(cv, null, 2)}

Return a JSON object with exactly this structure:
{
  "cv": { ...complete tailored CVData object, same structure as input... },
  "changes": [{ "field": "summary", "reason": "Emphasized React experience to match job requirements" }],
  "matchScore": 85,
  "missingSkills": ["Docker", "Kubernetes"],
  "jobKeywords": ["React", "TypeScript", "REST APIs"]
}

The tailored CV should:
1. Rewrite the summary to directly address the role and company
2. Enhance experience descriptions to highlight most relevant achievements
3. Reorder skills to put most relevant ones first
4. Add any skills the person already has but didn't mention
5. Keep all dates, company names, and factual info exactly the same
6. Fill summaryEn and all En fields with professional English equivalents
7. Keep template, country, language, cvMode from the original

RETURN ONLY THE JSON OBJECT.`
}

// ── buildIntelligencePrompt ───────────────────────────────────────────────────

type CVLike = Record<string, unknown>

export function buildIntelligencePrompt(cv: CVLike): string {
  const p   = cv.personal    as Record<string, string>           | undefined
  const exp = cv.experience  as Record<string, unknown>[]        | undefined
  const edu = cv.education   as Record<string, unknown>[]        | undefined
  const sk  = cv.skills      as { name: string }[]               | undefined
  const lng = cv.languages   as { name: string; level: string }[]| undefined
  const cer = cv.certificates as { name: string }[]              | undefined

  return `Analyze this professional profile and return a career intelligence report.

PROFILE:
Name: ${p?.fullName || p?.fullNameEn || 'Unknown'}
Job Title: ${p?.jobTitle || p?.jobTitleEn || 'Unknown'}
Location/Country: ${cv.country || 'MA'} | ${p?.location || ''}
Experience: ${exp?.length || 0} positions
  ${exp?.slice(0, 3).map(e =>
    `- ${e.jobTitle || e.jobTitleEn} at ${e.company || e.companyEn} (${e.startDate}–${e.isCurrent ? 'Present' : e.endDate})`
  ).join('\n  ') || 'None'}
Education: ${edu?.map(e =>
    `${e.degree || e.degreeEn} in ${e.field || e.fieldEn} — ${e.institution || e.institutionEn}`
  ).join('; ') || 'None'}
Skills: ${sk?.map(s => s.name).join(', ')  || 'None'}
Languages: ${lng?.map(l => `${l.name} (${l.level})`).join(', ') || 'None'}
Certificates: ${cer?.map(c => c.name).join(', ') || 'None'}

Return this exact JSON structure (fill ALL fields with real data):
{
  "healthScore": 72,
  "healthLabel": "جيد", "healthLabelEn": "Good",
  "healthSummary": "ملخص عربي موجز في 1-2 جملة",
  "healthSummaryEn": "Brief English summary in 1-2 sentences",
  "salaryIntel": {
    "currency": "AED", "currencySymbol": "د.إ",
    "min": 12000, "mid": 17000, "max": 24000, "userEstimate": 15000,
    "marketLabel": "مطوّر Full Stack — دبي", "marketLabelEn": "Full Stack Developer — Dubai",
    "byCountry": [
      { "code": "MA", "name": "المغرب",    "nameEn": "Morocco",      "min": 8000,  "max": 18000, "currency": "MAD", "symbol": "د.م",  "demand": "high" },
      { "code": "AE", "name": "الإمارات",  "nameEn": "UAE",          "min": 12000, "max": 28000, "currency": "AED", "symbol": "د.إ",  "demand": "very_high" },
      { "code": "SA", "name": "السعودية",  "nameEn": "Saudi Arabia", "min": 10000, "max": 25000, "currency": "SAR", "symbol": "ر.س",  "demand": "high" },
      { "code": "EG", "name": "مصر",       "nameEn": "Egypt",        "min": 15000, "max": 35000, "currency": "EGP", "symbol": "ج.م",  "demand": "medium" },
      { "code": "QA", "name": "قطر",       "nameEn": "Qatar",        "min": 11000, "max": 26000, "currency": "QAR", "symbol": "ر.ق",  "demand": "high" }
    ],
    "insight": "نصيحة مخصصة حول الراتب", "insightEn": "Personalized salary insight"
  },
  "skillGaps": [
    { "skill": "Docker", "urgency": "critical", "demandPct": 78,
      "reason": "سبب الأهمية", "reasonEn": "Why this matters",
      "learningTime": "4-6 أسابيع", "learningTimeEn": "4-6 weeks",
      "freeResource": "https://docs.docker.com/get-started/" }
  ],
  "strengths": [
    { "skill": "React", "demandPct": 91, "label": "مطلوب جداً", "labelEn": "Very High Demand", "color": "#22C55E" }
  ],
  "marketPulse": [
    { "sector": "التكنولوجيا المالية", "sectorEn": "Fintech",
      "country": "AE", "countryName": "الإمارات", "countryNameEn": "UAE",
      "momentum": "accelerating", "growthPct": 34, "jobCount": "2,400+",
      "matchScore": 85, "topCompanies": ["Careem","Tabby","Telda"],
      "insight": "نصيحة القطاع", "insightEn": "Sector insight", "flag": "🇦🇪" }
  ],
  "actionPlan": [
    { "priority": 1, "action": "الإجراء المقترح", "actionEn": "Suggested action",
      "impact": "high", "timeframe": "هذا الأسبوع", "timeframeEn": "This week", "icon": "⚡" }
  ],
  "generatedAt": "${new Date().toISOString()}",
  "profileCompleteness": 68
}

Rules:
- healthScore: 0-100 based on CV completeness + market fit + skills demand
- skillGaps: 3-5 most important missing skills for their role
- strengths: 3-5 skills they have that are in high demand
- marketPulse: 3-4 best-matching sectors/countries with real growth data
- actionPlan: 3-4 specific, actionable steps ordered by priority
- All salary figures must be realistic (monthly, not annual)
- urgency: "critical" | "important" | "nice_to_have"
- momentum: "accelerating" | "stable" | "slowing"
- impact: "high" | "medium" | "low"
- RETURN ONLY THE JSON OBJECT`
}

// ── LinkedIn Profile Import ───────────────────────────────────────────────────

export const LINKEDIN_EXTRACT_SYSTEM = `You are an expert CV data extractor. The user will paste raw text copied from their LinkedIn profile page.
Your job is to extract structured professional data and return it as a clean JSON object matching the seerti CV format.

Rules:
- Extract ONLY information explicitly present in the text — never invent or embellish
- For dates: convert "Jan 2020 – Mar 2023" → startDate "January 2020", endDate "March 2023"
- For "Present" or "Current": set isCurrent: true, endDate: ""
- Skill levels: infer from context (endorsed ≥ 50 = advanced/expert, mentioned = intermediate)
- Language levels: infer from "Native", "Professional", "Limited", "Elementary"
- Always fill BOTH Arabic and English fields: for Arabic names use the original, for English keep as-is
- Strip LinkedIn UI artifacts like "• 500+ connections", "Follow", "Message", "See all", "Show more", etc.
- If a section is absent from the pasted text, return an empty array for it
- RETURN ONLY VALID JSON — no markdown, no explanation, no backticks`

export function buildLinkedInExtractPrompt(rawText: string): string {
  return `Extract all CV data from this LinkedIn profile text and return as JSON matching this exact structure:

{
  "personal": {
    "fullName": "",
    "fullNameEn": "",
    "jobTitle": "",
    "jobTitleEn": "",
    "email": "",
    "phone": "",
    "location": "",
    "locationEn": "",
    "website": "",
    "linkedin": "",
    "summary": "",
    "summaryEn": ""
  },
  "experience": [
    {
      "id": "exp1",
      "jobTitle": "",
      "jobTitleEn": "",
      "company": "",
      "companyEn": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "isCurrent": false,
      "description": "",
      "descriptionEn": "",
      "achievements": []
    }
  ],
  "education": [
    {
      "id": "edu1",
      "degree": "",
      "degreeEn": "",
      "field": "",
      "fieldEn": "",
      "institution": "",
      "institutionEn": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "honors": ""
    }
  ],
  "skills": [
    { "id": "sk1", "name": "", "level": "intermediate" }
  ],
  "languages": [
    { "id": "ln1", "name": "", "level": "professional" }
  ],
  "certificates": [
    { "id": "cert1", "name": "", "issuer": "", "date": "", "url": "" }
  ]
}

LINKEDIN PROFILE TEXT:
---
${rawText.slice(0, 12000)}
---

Return ONLY the JSON object. Fill every field you can extract. Use empty string "" for missing text fields, false for missing booleans, [] for missing arrays.`
}
