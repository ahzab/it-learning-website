// lib/ai/gemini.ts
// Google Gemini client — drop-in replacement for the Anthropic client.
// Every route that previously used callClaude/callClaudeJSON/callClaudeStream
// now calls the identical exports from this file.
//
// ── Model strategy ────────────────────────────────────────────────────────────
//
//  FLASH (gemini-2.5-flash)   → streaming text generation
//    • Ultra-fast SSE streaming for the builder AI panel
//    • 1M token context window
//    • Excellent Arabic + English bilingual quality
//    • ~10x cheaper than Pro — ideal for high-frequency assist calls
//    • callClaudeStream() uses this model
//
//  PRO (gemini-2.5-pro)       → structured JSON tasks
//    • Best-in-class reasoning and instruction following
//    • Native JSON mode (responseMimeType: 'application/json')
//    • Used for: CV generation, tailoring, LinkedIn extraction, intelligence
//    • Slower but called infrequently (user-triggered, not real-time)
//    • callClaudeJSON() uses this model
//    • callClaude() uses this model (used for mobile non-streaming)
//
// API docs: https://ai.google.dev/api/generate-content

const FLASH_MODEL = 'gemini-2.5-flash'
const PRO_MODEL   = 'gemini-2.5-pro'
const BASE        = 'https://generativelanguage.googleapis.com/v1beta/models'

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!key) throw new GeminiError('GEMINI_API_KEY is not configured', 500)
  return key
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeminiMessage {
  role:    'user' | 'model'
  content: string
}

// Keep the same interface as the old Anthropic client so services don't change
export interface ClaudeMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface ClaudeOptions {
  system?:    string
  messages:   ClaudeMessage[]
  maxTokens?: number
  model?:     string   // optional override; defaults to PRO_MODEL for JSON, FLASH for stream
}

// ── Internal: convert options to Gemini request body ──────────────────────────

function buildRequest(
  opts: ClaudeOptions,
  options: { jsonMode?: boolean } = {},
) {
  const { jsonMode = false } = options

  // Gemini uses 'contents' (array of {role, parts}) + optional systemInstruction
  const contents = opts.messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
      temperature:     jsonMode ? 0.2 : 0.75,   // lower temp for JSON = more reliable structure
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  // System instruction (separate from contents in Gemini API)
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] }
  }

  return body
}

// ── callClaude — full text response (uses Pro for quality) ───────────────────

export async function callClaude(opts: ClaudeOptions): Promise<{ text: string }> {
  const model = opts.model ?? PRO_MODEL
  const url   = `${BASE}/${model}:generateContent?key=${apiKey()}`

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(buildRequest(opts)),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new GeminiError(`Gemini ${res.status}: ${body}`, res.status)
  }

  const data = await res.json()
  const text = extractText(data)
  return { text }
}

// ── callClaudeJSON — parse response as JSON (uses Pro for accuracy) ───────────
// Uses Gemini's native JSON mode (responseMimeType: 'application/json')
// for guaranteed valid JSON output — no markdown fences, no preamble.

export async function callClaudeJSON<T = unknown>(opts: ClaudeOptions): Promise<T> {
  const model = opts.model ?? PRO_MODEL
  const url   = `${BASE}/${model}:generateContent?key=${apiKey()}`

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(buildRequest(opts, { jsonMode: true })),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new GeminiError(`Gemini ${res.status}: ${body}`, res.status)
  }

  const data = await res.json()
  const text = extractText(data)

  // With responseMimeType: 'application/json', Gemini guarantees valid JSON.
  // Strip markdown fences as a safety net for edge cases.
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```\s*$/m, '').trim()

  try {
    return JSON.parse(clean) as T
  } catch {
    throw new ParseError(
      `Gemini returned non-JSON.\nFirst 400 chars: ${clean.slice(0, 400)}`,
    )
  }
}

// ── callClaudeStream — SSE streaming for web builder (uses Flash for speed) ───
//
// Gemini SSE format per event:
//   data: {"candidates":[{"content":{"parts":[{"text":"chunk"}],"role":"model"},...}]}
//
// We translate to our unified internal SSE format so the frontend hook is
// provider-agnostic. The frontend hook (hooks/useAI.ts) reads this format.
//
// Emitted SSE lines:
//   data: {"type":"delta","text":"chunk text"}
//   data: [DONE]

export async function callClaudeStream(opts: ClaudeOptions): Promise<Response> {
  const model = opts.model ?? FLASH_MODEL
  const url   = `${BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey()}`

  const upstream = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(buildRequest(opts)),
  })

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => '')
    throw new GeminiError(`Gemini stream ${upstream.status}: ${body}`, upstream.status)
  }

  // Transform Gemini SSE → our unified SSE format
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer   = writable.getWriter()
  const encoder  = new TextEncoder()
  const decoder  = new TextDecoder()

  ;(async () => {
    const reader = upstream.body!.getReader()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''   // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload || payload === '[DONE]') continue

          try {
            const event = JSON.parse(payload)
            const text  = event?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
            if (text) {
              // Emit in our unified format: {"type":"delta","text":"..."}
              const out = `data: ${JSON.stringify({ type: 'delta', text })}\n\n`
              await writer.write(encoder.encode(out))
            }
          } catch {
            // skip malformed Gemini events
          }
        }
      }
    } finally {
      // Emit [DONE] sentinel so the frontend knows stream is complete
      await writer.write(encoder.encode('data: [DONE]\n\n')).catch(() => {})
      await writer.close().catch(() => {})
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}

// ── Internal helper ───────────────────────────────────────────────────────────

function extractText(data: unknown): string {
  const candidates = (data as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  })?.candidates
  return candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class GeminiError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message)
    this.name = 'GeminiError'
  }
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

// ── Backward-compat aliases (used by ai.service.ts error handling) ────────────
export { GeminiError as AnthropicError }
