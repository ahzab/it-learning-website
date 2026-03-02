// lib/mobile-auth.ts
// JWT-based auth for the mobile API.

import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'

function b64url(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
}
function b64urlStr(str: string): string { return b64url(new TextEncoder().encode(str)) }
function b64urlDecode(str: string): string {
  const p = str.replace(/-/g,'+').replace(/_/g,'/')
  const pad = p.length % 4
  return Buffer.from(pad ? p + '='.repeat(4-pad) : p, 'base64').toString('utf-8')
}
function b64urlDecodeBytes(str: string): Uint8Array {
  const p = str.replace(/-/g,'+').replace(/_/g,'/')
  const pad = p.length % 4
  return new Uint8Array(Buffer.from(pad ? p + '='.repeat(4-pad) : p, 'base64'))
}

export interface MobileTokenPayload { sub: string; email: string; plan: string; iat: number; exp: number }

export async function signMobileToken(payload: Omit<MobileTokenPayload,'iat'|'exp'>, days = 30): Promise<string> {
  const now = Math.floor(Date.now()/1000)
  const full = { ...payload, iat: now, exp: now + 86400*days }
  const header  = b64urlStr(JSON.stringify({ alg:'HS256', typ:'JWT' }))
  const body    = b64urlStr(JSON.stringify(full))
  const signing = `${header}.${body}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(JWT_SECRET), { name:'HMAC', hash:'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signing))
  return `${signing}.${b64url(sig)}`
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const signing = `${header}.${body}`
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(JWT_SECRET), { name:'HMAC', hash:'SHA-256' }, false, ['verify'])
    const valid = await crypto.subtle.verify('HMAC', key, b64urlDecodeBytes(sig), new TextEncoder().encode(signing))
    if (!valid) return null
    const payload = JSON.parse(b64urlDecode(body)) as MobileTokenPayload
    if (payload.exp < Math.floor(Date.now()/1000)) return null
    return payload
  } catch { return null }
}

export async function getMobileUser(req: NextRequest): Promise<{id:string;email:string;plan:string}|null> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const payload = await verifyMobileToken(auth.slice(7))
  if (!payload) return null
  return { id: payload.sub, email: payload.email, plan: payload.plan }
}

const CORS = { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }

export function ok<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), { status, headers: CORS })
}
export function err(message: string, status = 400, code = 'ERROR', extra?: Record<string, unknown>): Response {
  const body = { success: false, error: { message, code, ...extra } }
  return new Response(JSON.stringify(body), { status, headers: CORS })
}
export function unauthorized(): Response {
  return err('Invalid or expired token', 401, 'UNAUTHORIZED')
}
export function corsOptions(): Response {
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }})
}
