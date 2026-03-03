// lib/services/auth.service.ts
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
import { track } from '@/lib/observability'

const log = logger('auth.service')
const HASH_ROUNDS = 12

export interface PublicUser {
  id:    string
  name:  string | null
  email: string | null
  plan:  string
  image?: string | null
}

export type RegisterResult =
  | { ok: true;  user: PublicUser }
  | { ok: false; code: 'EMAIL_TAKEN' | 'DB_ERROR'; message: string }

export type LoginResult =
  | { ok: true;  user: PublicUser }
  | { ok: false; code: 'INVALID_CREDENTIALS' | 'DB_ERROR'; message: string }

function toPublic(u: PublicUser & { image?: string | null }): PublicUser {
  return { id: u.id, name: u.name, email: u.email, plan: u.plan, image: u.image }
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  ip?: string,
): Promise<RegisterResult> {
  const normEmail = email.toLowerCase().trim()

  try {
    const existing = await prisma.user.findUnique({ where: { email: normEmail } })
    if (existing) {
      track({ name: 'auth.register', ip, severity: 'warn',
        data: { outcome: 'email_taken', email: normEmail } })
      return { ok: false, code: 'EMAIL_TAKEN', message: 'Email already in use' }
    }

    const hashed = await bcrypt.hash(password, HASH_ROUNDS)
    const user   = await prisma.user.create({
      data:   { name: name.trim(), email: normEmail, password: hashed },
      select: { id: true, name: true, email: true, plan: true, image: true },
    })

    track({ name: 'auth.register', userId: user.id, plan: user.plan, ip,
      data: { outcome: 'success', email: normEmail } })
    return { ok: true, user: toPublic(user as PublicUser) }
  } catch (e) {
    log.error('registerUser', e)
    track({ name: 'system.db_error', ip, severity: 'critical',
      data: { op: 'registerUser', error: String(e) } })
    return { ok: false, code: 'DB_ERROR', message: 'Failed to create account' }
  }
}

export async function loginUser(
  email: string,
  password: string,
  ip?: string,
): Promise<LoginResult> {
  const normEmail = email.toLowerCase().trim()

  try {
    const user = await prisma.user.findUnique({
      where:  { email: normEmail },
      select: { id: true, name: true, email: true, plan: true, image: true, password: true },
    })

    if (!user?.password) {
      track({ name: 'auth.login_failed', ip, severity: 'warn',
        data: { reason: 'no_account', email: normEmail } })
      return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      track({ name: 'auth.login_failed', userId: user.id, ip, severity: 'warn',
        data: { reason: 'bad_password' } })
      return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    }

    track({ name: 'auth.login', userId: user.id, plan: user.plan, ip,
      data: { outcome: 'success' } })
    return { ok: true, user: toPublic(user as PublicUser & { password: string }) }
  } catch (e) {
    log.error('loginUser', e)
    track({ name: 'system.db_error', ip, severity: 'critical',
      data: { op: 'loginUser', error: String(e) } })
    return { ok: false, code: 'DB_ERROR', message: 'Authentication failed' }
  }
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where:  { id },
      select: { id: true, name: true, email: true, plan: true, image: true, createdAt: true },
    })
    return user ? toPublic(user as PublicUser) : null
  } catch (e) {
    log.error('getUserById', e)
    track({ name: 'system.db_error', severity: 'critical',
      data: { op: 'getUserById', userId: id, error: String(e) } })
    return null
  }
}

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
    log.error('updateUserProfile', e)
    track({ name: 'system.db_error', severity: 'critical',
      data: { op: 'updateUserProfile', userId: id, error: String(e) } })
    return null
  }
}
