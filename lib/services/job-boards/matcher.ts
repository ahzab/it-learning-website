// lib/services/job-boards/matcher.ts
// AI-powered job match scoring against user's CV.
// Uses Gemini Flash (cheap + fast) since this runs per-job on demand.

import { callClaudeJSON, GeminiError, ParseError } from '@/lib/ai/gemini'
import type { JobPosting, JobMatchResult } from '@/types/jobs'
import type { CVData } from '@/types/cv'

const MATCH_SYSTEM = `You are a senior MENA career advisor and technical recruiter.
Your job is to evaluate how well a candidate's CV matches a specific job posting.
You are objective, specific, and focused on the MENA job market context.
Return ONLY valid JSON — no markdown, no explanation.`

function buildMatchPrompt(job: JobPosting, cv: Partial<CVData>): string {
  const cvSummary = {
    jobTitle:    cv.personal?.jobTitle || cv.personal?.jobTitleEn,
    summary:     cv.personal?.summary  || cv.personal?.summaryEn,
    experience:  (cv.experience || []).slice(0, 4).map(e => ({
      title:    e.jobTitle || e.jobTitleEn,
      company:  e.company  || e.companyEn,
      duration: `${e.startDate}–${e.isCurrent ? 'Present' : e.endDate}`,
      desc:     (e.description || e.descriptionEn || '').slice(0, 200),
    })),
    skills:      (cv.skills || []).map(s => s.name),
    education:   (cv.education || []).slice(0, 2).map(e => ({
      degree:      e.degree || e.degreeEn,
      institution: e.institution || e.institutionEn,
    })),
    languages:   (cv.languages || []).map(l => `${l.name} (${l.level})`),
    country:     cv.country,
  }

  const jobSummary = {
    title:           job.title,
    company:         job.company,
    location:        job.location,
    type:            job.jobType,
    level:           job.experienceLevel,
    requiredSkills:  job.skills,
    sector:          job.sector,
    description:     job.descriptionText?.slice(0, 800) || job.description.slice(0, 800),
  }

  return `Evaluate this candidate's CV against the job posting.

CANDIDATE CV:
${JSON.stringify(cvSummary, null, 2)}

JOB POSTING:
${JSON.stringify(jobSummary, null, 2)}

Return a JSON object with this exact structure:
{
  "score": 0-100,
  "reasons": ["max 4 specific reasons why this is a good match — reference actual skills/experience"],
  "missingSkills": ["skills in the job requirements the candidate lacks"],
  "suggestions": ["max 3 actionable tips to improve the match — be specific"],
  "timeToApply": "apply_now" | "strengthen_first" | "not_a_fit"
}

Scoring guide:
- 80-100: Strong match — candidate meets 80%+ of requirements
- 60-79:  Good match — some gaps but worth applying
- 40-59:  Partial — significant gaps, suggest improving first
- 0-39:   Poor match — fundamental misalignment

timeToApply logic:
- "apply_now"        → score ≥ 65
- "strengthen_first" → score 40-64
- "not_a_fit"        → score < 40

Be brutally honest. Do not inflate scores. MENA employers are selective.
RETURN ONLY THE JSON OBJECT.`
}

export async function scoreJobMatch(
  job:    JobPosting,
  cv:     Partial<CVData>,
): Promise<JobMatchResult> {
  try {
    const result = await callClaudeJSON<{
      score:         number
      reasons:       string[]
      missingSkills: string[]
      suggestions:   string[]
      timeToApply:   'apply_now' | 'strengthen_first' | 'not_a_fit'
    }>({
      system:    MATCH_SYSTEM,
      messages:  [{ role: 'user', content: buildMatchPrompt(job, cv) }],
      maxTokens: 600,
    })

    return {
      jobId:         job.id,
      score:         Math.min(100, Math.max(0, result.score ?? 0)),
      reasons:       result.reasons       || [],
      missingSkills: result.missingSkills || [],
      suggestions:   result.suggestions   || [],
      timeToApply:   result.timeToApply   || 'strengthen_first',
    }
  } catch (e) {
    if (e instanceof GeminiError || e instanceof ParseError) {
      // Fallback: simple skill-overlap scoring
      return skillOverlapScore(job, cv)
    }
    throw e
  }
}

// Deterministic fallback when AI is unavailable
function skillOverlapScore(job: JobPosting, cv: Partial<CVData>): JobMatchResult {
  const cvSkills = new Set(
    (cv.skills || []).map(s => s.name.toLowerCase())
  )
  const jobSkills = job.skills.map(s => s.toLowerCase())
  const matched   = jobSkills.filter(s => cvSkills.has(s))
  const missing   = jobSkills.filter(s => !cvSkills.has(s)).slice(0, 5)
  const score     = jobSkills.length > 0
    ? Math.round((matched.length / jobSkills.length) * 80)
    : 50

  return {
    jobId:         job.id,
    score,
    reasons:       matched.slice(0, 3).map(s => `Your ${s} skills match the requirements`),
    missingSkills: missing,
    suggestions:   missing.slice(0, 2).map(s => `Add ${s} to your skill set`),
    timeToApply:   score >= 65 ? 'apply_now' : score >= 40 ? 'strengthen_first' : 'not_a_fit',
  }
}
