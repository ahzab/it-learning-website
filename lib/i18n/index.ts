// lib/i18n/index.ts — i18n barrel export
export { ar } from './ar'
export { en } from './en'
export { fr } from './fr'
export type { Translations } from './ar'

export const LOCALES = ['ar', 'en', 'fr'] as const
export type Locale = typeof LOCALES[number]

import { ar } from './ar'
import { en } from './en'
import { fr } from './fr'

export const translations = { ar, en, fr } as const
