// lib/utils/logger.ts
// Centralized structured logger for all services and routes.
//
// Today it logs to console. Tomorrow you can swap the transport
// (Sentry, Datadog, etc.) in one place — every caller stays the same.
//
// Usage:
//   import { logger } from '@/lib/utils/logger'
//   const log = logger('auth.service')
//   log.error('registerUser failed', error)
//   log.warn('Suspicious login attempt', { email, ip })
//   log.info('CV created', { userId, cvId })

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level:     LogLevel
  namespace: string
  message:   string
  data?:     unknown
  timestamp: string
}

// ── Transport ─────────────────────────────────────────────────────────────────
// Replace this function to change where logs go.

function emit(entry: LogEntry): void {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.namespace}]`

  switch (entry.level) {
    case 'debug':
      if (process.env.LOG_LEVEL === 'debug') {
        console.debug(prefix, entry.message, entry.data ?? '')
      }
      break
    case 'info':
      console.log(prefix, entry.message, entry.data ?? '')
      break
    case 'warn':
      console.warn(prefix, entry.message, entry.data ?? '')
      break
    case 'error':
      console.error(prefix, entry.message, entry.data ?? '')
      break
  }
}

// ── Logger factory ────────────────────────────────────────────────────────────

export interface Logger {
  debug(message: string, data?: unknown): void
  info (message: string, data?: unknown): void
  warn (message: string, data?: unknown): void
  error(message: string, data?: unknown): void
  child(namespace: string): Logger
}

export function logger(namespace: string): Logger {
  const log = (level: LogLevel, message: string, data?: unknown) => {
    emit({
      level,
      namespace,
      message,
      data,
      timestamp: new Date().toISOString(),
    })
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info:  (msg, data) => log('info',  msg, data),
    warn:  (msg, data) => log('warn',  msg, data),
    error: (msg, data) => log('error', msg, data),
    child: (sub) => logger(`${namespace}:${sub}`),
  }
}

// ── Root logger — for one-off use without a namespace ─────────────────────────
export const rootLogger = logger('app')
