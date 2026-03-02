'use client'
// hooks/useSaveCV.ts
// Handles saving the CV to the database (create + update) with autosave.

import { useState, useEffect, useRef, useCallback } from 'react'
import { CVData } from '@/types/cv'
import { useCVStore } from '@/lib/store'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseSaveCVReturn {
  cvId: string | null
  saveStatus: SaveStatus
  lastSaved: Date | null
  title: string
  setTitle: (t: string) => void
  saveNow: () => Promise<void>
}

export function useSaveCV(initialCvId?: string): UseSaveCVReturn {
  const cv = useCVStore((s) => s.cv)
  const loadCV = useCVStore((s) => s.loadCV)

  const [cvId, setCvId]         = useState<string | null>(initialCvId || null)
  const [saveStatus, setStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [title, setTitle]       = useState('سيرتي الذاتية')

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>()
  const isSaving      = useRef(false)
  const latestCV      = useRef(cv)

  // Keep latest cv in ref so the autosave timer always sees fresh data
  useEffect(() => { latestCV.current = cv }, [cv])

  // ── Load existing CV on mount ─────────────────────────────────────
  useEffect(() => {
    if (!initialCvId) return
    fetch(`/api/cv/${initialCvId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) {
          loadCV(data.data)  // normalizeCV inside loadCV handles any missing/invalid fields
          setTitle(data.title || 'سيرتي الذاتية')
          setLastSaved(new Date(data.updatedAt))
        }
      })
      .catch(console.error)
  }, [initialCvId])

  // ── Core save function ────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    if (isSaving.current) return
    isSaving.current = true
    setStatus('saving')

    try {
      const payload = {
        title,
        data: latestCV.current,
        template: latestCV.current.template,
        language: latestCV.current.language?.toUpperCase() || 'AR',
        country: latestCV.current.country || 'MA',
      }

      let res: Response

      if (cvId) {
        // Update existing
        res = await fetch(`/api/cv/${cvId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new
        res = await fetch('/api/cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setCvId(created.id)
          // Update URL without full navigation
          window.history.replaceState({}, '', `/builder?id=${created.id}`)
        }
      }

      if (res.ok) {
        setStatus('saved')
        setLastSaved(new Date())
        // Reset to idle after 3s
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      isSaving.current = false
    }
  }, [cvId, title])

  // ── Autosave: 3s after last change ───────────────────────────────
  useEffect(() => {
    // Don't autosave if there's nothing meaningful yet
    const hasContent = cv.personal.fullName || cv.personal.fullNameEn || cv.experience.length > 0
    if (!hasContent) return

    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      saveNow()
    }, 3000)

    return () => clearTimeout(autosaveTimer.current)
  }, [cv, saveNow])

  return { cvId, saveStatus, lastSaved, title, setTitle, saveNow }
}
