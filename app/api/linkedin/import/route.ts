// app/api/linkedin/import/route.ts
//
// Handles three LinkedIn import modes:
//
//   1. text (paste mode) — user copies & pastes their LinkedIn profile page text
//      Body: { text: string }
//      → passes directly to Claude for extraction
//
//   2. url (profile URL) — user pastes their linkedin.com/in/... URL
//      Body: { url: string }
//      → LinkedIn blocks server-side scraping, so we return a 422 with instructions
//        telling the UI to switch to paste mode. The URL is acknowledged but not scraped.
//
//   3. zip (data export) — user uploads their LinkedIn data export ZIP
//      Body: FormData with file: File (ZIP)
//      → We extract text from key CSVs (Profile.csv, Positions.csv, Education.csv,
//        Skills.csv, Certifications.csv, Languages.csv) and build a text blob for Claude.
//
// All three paths ultimately call importFromLinkedIn(text) after text normalization.

export const runtime = 'nodejs'   // ZIP parsing requires Node.js (not edge)

import { getServerSession }       from 'next-auth'
import { authOptions }            from '@/lib/auth'
import { aiService }              from '@/lib/services'
import { mapAIResult }            from '@/lib/utils'
import { z }                      from 'zod'

const textSchema = z.object({
  text: z.string()
    .min(50,    { message: 'النص قصير جداً — الصق المزيد من محتوى ملفك الشخصي' })
    .max(20000, { message: 'النص طويل جداً — 20,000 حرف كحد أقصى' }),
})

export async function POST(req: Request) {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') ?? ''

  // ══════════════════════════════════════════════════════════════════════════
  // Mode 3: ZIP data export
  // ══════════════════════════════════════════════════════════════════════════
  if (contentType.includes('multipart/form-data')) {
    let formData: FormData
    try { formData = await req.formData() }
    catch { return Response.json({ error: 'فشل قراءة الملف' }, { status: 400 }) }

    const file = formData.get('file') as File | null
    if (!file) {
      return Response.json({ error: 'لم يُرفع أي ملف' }, { status: 400 })
    }
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return Response.json({ error: 'يجب أن يكون الملف بصيغة ZIP' }, { status: 422 })
    }
    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: 'حجم الملف يتجاوز 25MB' }, { status: 422 })
    }

    // Extract text from LinkedIn CSV files inside the ZIP
    let text: string
    try {
      text = await extractTextFromLinkedInZip(file)
    } catch (err) {
      return Response.json({
        error: 'تعذر قراءة ملف ZIP. تأكد أنه ملف تصدير بيانات LinkedIn الرسمي.',
      }, { status: 422 })
    }

    if (text.length < 50) {
      return Response.json({
        error: 'لم يُعثر على بيانات كافية في ملف ZIP. تأكد من تحميل ملف التصدير الصحيح.',
      }, { status: 422 })
    }

    const result = await aiService.importFromLinkedIn(text)
    return mapAIResult(result, data => ({ ok: true, cv: data, source: 'zip' }))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Modes 1 & 2: JSON body (text paste or URL)
  // ══════════════════════════════════════════════════════════════════════════
  let body: unknown
  try { body = await req.json() }
  catch { return Response.json({ error: 'طلب غير صالح' }, { status: 400 }) }

  const bodyObj = body as Record<string, unknown>

  // ── Mode 2: URL ────────────────────────────────────────────────────────────
  // We cannot scrape LinkedIn from the server (they block it). Return 422 with
  // instructions so the client falls back to the paste mode.
  if (typeof bodyObj.url === 'string') {
    const url = bodyObj.url.trim()
    if (!url.includes('linkedin.com/in/')) {
      return Response.json({ error: 'يجب أن يكون رابط linkedin.com/in/...' }, { status: 422 })
    }
    return Response.json({
      error: 'url_mode_unavailable',
      message: 'LinkedIn يمنع الوصول الآلي لصفحات الملفات الشخصية. استخدم طريقة النسخ واللصق بدلاً من ذلك.',
      fallback: 'paste',
      url,
    }, { status: 422 })
  }

  // ── Mode 1: Text paste ─────────────────────────────────────────────────────
  const parsed = textSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]?.message ?? 'خطأ في التحقق'
    return Response.json({ error: first }, { status: 422 })
  }

  const result = await aiService.importFromLinkedIn(parsed.data.text)
  return mapAIResult(result, data => ({ ok: true, cv: data, source: 'text' }))
}

// ────────────────────────────────────────────────────────────────────────────
// ZIP extraction helper
//
// LinkedIn data export ZIPs contain CSVs. We look for the well-known files
// and combine them into a plain-text blob that Claude can parse.
//
// Known LinkedIn CSV files and their relevant columns:
//   Profile.csv              → First Name, Last Name, Headline, Summary, Industry
//   Positions.csv            → Company Name, Title, Description, Started On, Finished On
//   Education.csv            → School Name, Degree Name, Notes, Start Date, End Date
//   Skills.csv               → Name
//   Certifications.csv       → Name, Authority, Started On, Url
//   Languages.csv            → Name, Proficiency
//   Recommendations Received.csv → Recommender First Name, etc. (optional)
// ────────────────────────────────────────────────────────────────────────────

async function extractTextFromLinkedInZip(file: File): Promise<string> {
  // Dynamically import fflate (pure-JS ZIP, works in Node.js without native deps)
  const { unzipSync, strFromU8 } = await import('fflate')

  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  let unzipped: Record<string, Uint8Array>
  try {
    unzipped = unzipSync(uint8)
  } catch {
    throw new Error('Invalid ZIP file')
  }

  // Map filename (case-insensitive) → decoded string
  const files: Record<string, string> = {}
  for (const [name, data] of Object.entries(unzipped)) {
    const baseName = name.split('/').pop()?.toLowerCase() ?? ''
    if (baseName.endsWith('.csv')) {
      try {
        files[baseName] = strFromU8(data)
      } catch {
        // skip unreadable files
      }
    }
  }

  const sections: string[] = []

  // ── Profile ──────────────────────────────────────────────────────────────
  const profile = files['profile.csv']
  if (profile) {
    const rows = parseCSV(profile)
    if (rows.length >= 2) {
      const h = rows[0]
      const d = rows[1]
      const get = (col: string) => d[h.indexOf(col)] ?? ''
      sections.push([
        '== PERSONAL INFO ==',
        `Name: ${get('First Name')} ${get('Last Name')}`,
        `Headline: ${get('Headline')}`,
        `Summary: ${get('Summary')}`,
        `Industry: ${get('Industry')}`,
        `Location: ${get('Geo Location')}`,
        `Twitter: ${get('Twitter Handles')}`,
        `Websites: ${get('Websites')}`,
      ].filter(l => l.split(': ')[1]?.trim()).join('\n'))
    }
  }

  // ── Positions / Experience ────────────────────────────────────────────────
  const positions = files['positions.csv']
  if (positions) {
    const rows = parseCSV(positions)
    if (rows.length >= 2) {
      const h = rows[0]
      sections.push('== WORK EXPERIENCE ==')
      for (const d of rows.slice(1)) {
        const get = (col: string) => d[h.indexOf(col)] ?? ''
        sections.push([
          `Title: ${get('Title')}`,
          `Company: ${get('Company Name')}`,
          `Location: ${get('Location')}`,
          `Start: ${get('Started On')}`,
          `End: ${get('Finished On') || 'Present'}`,
          `Description: ${get('Description')}`,
        ].filter(l => l.split(': ')[1]?.trim()).join('\n'))
      }
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  const education = files['education.csv']
  if (education) {
    const rows = parseCSV(education)
    if (rows.length >= 2) {
      const h = rows[0]
      sections.push('== EDUCATION ==')
      for (const d of rows.slice(1)) {
        const get = (col: string) => d[h.indexOf(col)] ?? ''
        sections.push([
          `School: ${get('School Name')}`,
          `Degree: ${get('Degree Name')}`,
          `Field: ${get('Notes')}`,
          `Start: ${get('Start Date')}`,
          `End: ${get('End Date')}`,
        ].filter(l => l.split(': ')[1]?.trim()).join('\n'))
      }
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  const skills = files['skills.csv']
  if (skills) {
    const rows = parseCSV(skills)
    if (rows.length >= 2) {
      const nameIdx = rows[0].indexOf('Name')
      const names = rows.slice(1).map(r => r[nameIdx]).filter(Boolean)
      if (names.length > 0) {
        sections.push('== SKILLS ==\n' + names.join(', '))
      }
    }
  }

  // ── Languages ─────────────────────────────────────────────────────────────
  const languages = files['languages.csv']
  if (languages) {
    const rows = parseCSV(languages)
    if (rows.length >= 2) {
      const h = rows[0]
      const langs = rows.slice(1).map(d => {
        const name  = d[h.indexOf('Name')] ?? ''
        const level = d[h.indexOf('Proficiency')] ?? ''
        return level ? `${name} (${level})` : name
      }).filter(Boolean)
      if (langs.length > 0) {
        sections.push('== LANGUAGES ==\n' + langs.join(', '))
      }
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────
  const certs = files['certifications.csv'] || files['certificates.csv']
  if (certs) {
    const rows = parseCSV(certs)
    if (rows.length >= 2) {
      const h = rows[0]
      sections.push('== CERTIFICATIONS ==')
      for (const d of rows.slice(1)) {
        const get = (col: string) => d[h.indexOf(col)] ?? ''
        sections.push([
          `Name: ${get('Name')}`,
          `Authority: ${get('Authority')}`,
          `Issued: ${get('Started On')}`,
          `URL: ${get('Url')}`,
        ].filter(l => l.split(': ')[1]?.trim()).join('\n'))
      }
    }
  }

  return sections.join('\n\n').slice(0, 15000)
}

// Minimal CSV parser (handles quoted fields and commas inside quotes)
function parseCSV(csv: string): string[][] {
  const rows: string[][] = []
  const lines = csv.split(/\r?\n/)

  for (const line of lines) {
    if (!line.trim()) continue
    const row: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    row.push(current.trim())
    rows.push(row)
  }

  return rows
}

