// lib/services/auth.service.ts
// All authentication business logic.
// Used by: NextAuth authorize(), web register route, mobile register/login/me routes.

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

const log = logger('auth.service')

const HASH_ROUNDS = 12

// ── Shared user shape returned to callers ─────────────────────────────────────

export interface PublicUser {
  id:    string
  name:  string | null
  email: string | null
  plan:  string
  image?: string | null
}

// ── Discriminated union results — no thrown errors, callers switch on .ok ─────

export type RegisterResult =
  | { ok: true;  user: PublicUser }
  | { ok: false; code: 'EMAIL_TAKEN' | 'DB_ERROR'; message: string }

export type LoginResult =
  | { ok: true;  user: PublicUser }
  | { ok: false; code: 'INVALID_CREDENTIALS' | 'DB_ERROR'; message: string }

// ── Internal helper ───────────────────────────────────────────────────────────

function toPublic(u: PublicUser & { image?: string | null }): PublicUser {
  return { id: u.id, name: u.name, email: u.email, plan: u.plan, image: u.image }
}

// ── registerUser ──────────────────────────────────────────────────────────────

/**
 * Create a new account.
 * Normalises email, checks uniqueness, hashes password.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  const normEmail = email.toLowerCase().trim()

  try {
    const existing = await prisma.user.findUnique({ where: { email: normEmail } })
    if (existing) {
      return { ok: false, code: 'EMAIL_TAKEN', message: 'Email already in use' }
    }

    const hashed = await bcrypt.hash(password, HASH_ROUNDS)
    const user   = await prisma.user.create({
      data:   { name: name.trim(), email: normEmail, password: hashed },
      select: { id: true, name: true, email: true, plan: true, image: true },
    })

    return { ok: true, user: toPublic(user as PublicUser) }
  } catch (e) {
    log.error('registerUser',  e)
    return { ok: false, code: 'DB_ERROR', message: 'Failed to create account' }
  }
}

// ── loginUser ─────────────────────────────────────────────────────────────────

/**
 * Validate email + password.
 * Returns the same INVALID_CREDENTIALS code whether the account doesn't
 * exist or the password is wrong — deliberately prevents email enumeration.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResult> {
  const normEmail = email.toLowerCase().trim()

  try {
    const user = await prisma.user.findUnique({
      where:  { email: normEmail },
      select: { id: true, name: true, email: true, plan: true, image: true, password: true },
    })

    if (!user?.password) {
      return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    }

    return { ok: true, user: toPublic(user as PublicUser & { password: string }) }
  } catch (e) {
    log.error('loginUser',  e)
    return { ok: false, code: 'DB_ERROR', message: 'Authentication failed' }
  }
}

// ── getUserById ───────────────────────────────────────────────────────────────

/** Fetch a user by ID — used by NextAuth JWT callback and mobile /me. */
export async function getUserById(id: string): Promise<PublicUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where:  { id },
      select: { id: true, name: true, email: true, plan: true, image: true, createdAt: true },
    })
    return user ? toPublic(user as PublicUser) : null
  } catch (e) {
    log.error('getUserById',  e)
    return null
  }
}

// ── updateUserProfile ─────────────────────────────────────────────────────────

/** Update mutable profile fields (name, image). Used by mobile PATCH /me. */
export async function updateUserProfile(
  id: string,
  patch: { name?: string; image?: string },
): Promise<PublicUser | null> {
  try {
    const user = await prisma.user.update({
      where:  { id },
      data:   patch,
      select: { id: true, name: true, email: true, plan: true, image: true },
    })
    return toPublic(user as PublicUser)
  } catch (e) {
    log.error('updateUserProfile',  e)
    return null
  }
}
