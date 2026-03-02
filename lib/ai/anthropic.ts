// lib/ai/anthropic.ts
// The only place in the project that calls https://api.anthropic.com.
// Every route imports callClaude / callClaudeJSON / callClaudeStream.
// Swapping models, adding retries, or injecting logging happens here — once.

const BASE    = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-sonnet-4-20250514'
const VERSION = '2023-06-01'

function makeHeaders(stream = false): Record<string, string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new AnthropicError('ANTHROPIC_API_KEY is not configured', 500)
  return {
    'Content-Type':      'application/json',
    'x-api-key':         key,
    'anthropic-version': VERSION,
    ...(stream ? { 'anthropic-beta': 'messages-2023-12-15' } : {}),
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClaudeMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface ClaudeOptions {
  system?:    string
  messages:   ClaudeMessage[]
  maxTokens?: number
  model?:     string
}

// ── callClaude — full text response ──────────────────────────────────────────

export async function callClaude(opts: ClaudeOptions): Promise<string> {
  const res = await fetch(BASE, {
    method:  'POST',
    headers: makeHeaders(),
    body: JSON.stringify({
      model:      opts.model     ?? MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.system ? { system: opts.system } : {}),
      messages:   opts.messages,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new AnthropicError(`Anthropic ${res.status}: ${body}`, res.status)
  }

  const data = await res.json()
  return extractText(data)
}

// ── callClaudeJSON — parse response as JSON ───────────────────────────────────

export async function callClaudeJSON<T = unknown>(opts: ClaudeOptions): Promise<T> {
  const text  = await callClaude(opts)
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```\s*$/m, '').trim()
  try {
    return JSON.parse(clean) as T
  } catch {
    throw new ParseError(
      `Claude returned non-JSON.\nFirst 400 chars: ${clean.slice(0, 400)}`,
    )
  }
}

// ── callClaudeStream — SSE passthrough for web builder ───────────────────────

export async function callClaudeStream(opts: ClaudeOptions): Promise<Response> {
  const res = await fetch(BASE, {
    method:  'POST',
    headers: makeHeaders(true),
    body: JSON.stringify({
      model:      opts.model     ?? MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      stream:     true,
      ...(opts.system ? { system: opts.system } : {}),
      messages:   opts.messages,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new AnthropicError(`Anthropic stream ${res.status}: ${body}`, res.status)
  }

  return new Response(res.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}

// ── Internal helper ───────────────────────────────────────────────────────────

function extractText(data: unknown): string {
  const content = (data as { content?: { type: string; text?: string }[] })?.content
  return content?.find(b => b.type === 'text')?.text?.trim() ?? ''
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class AnthropicError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message)
    this.name = 'AnthropicError'
  }
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}
