'use client'
// components/dashboard/CVCardActions.tsx
// Per-CV action buttons: share (toggle public link) + delete.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n/context'

interface Props {
  cvId:      string
  cvTitle:   string
  isPublic?: boolean
}

export function CVCardActions({ cvId, cvTitle, isPublic: initialIsPublic = false }: Props) {
  const router          = useRouter()
  const { t, isRTL }   = useT()
  const b               = t.builder

  const [deleting,  setDeleting]  = useState(false)
  const [confirm,   setConfirm]   = useState(false)
  const [sharing,   setSharing]   = useState(false)
  const [isPublic,  setIsPublic]  = useState(initialIsPublic)
  const [copied,    setCopied]    = useState(false)

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/cv/${cvId}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirm(false)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const res = await fetch('/api/cv/public', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cvId, isPublic: !isPublic }),
      })
      if (res.ok) {
        const d = await res.json()
        setIsPublic(d.isPublic)
        if (d.isPublic) {
          const url = `${window.location.origin}/cv/${cvId}`
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
          } catch {
            window.open(url, '_blank')
          }
        }
      }
    } catch { /* silent */ }
    finally { setSharing(false) }
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/cv/${cvId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <>
      {/* Share button */}
      <button
        onClick={isPublic ? copyLink : handleShare}
        disabled={sharing}
        className={`px-3 py-2.5 rounded-lg text-sm transition-all border ${
          isPublic
            ? copied
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/18'
            : 'bg-white/5 border-white/8 text-gray-500 hover:text-teal-400 hover:border-teal-500/20'
        } disabled:opacity-40`}
        title={
          copied    ? (isRTL ? 'تم النسخ!' : 'Copied!')
          : isPublic ? (isRTL ? 'نسخ رابط المشاركة' : 'Copy share link')
          :            (isRTL ? 'مشاركة السيرة' : 'Make public')
        }
      >
        {sharing ? '⟳' : copied ? '✓' : isPublic ? '🔗' : '🔒'}
      </button>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
          confirm
            ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
            : 'bg-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-400'
        } disabled:opacity-40`}
        title={confirm ? `${isRTL ? 'تأكيد حذف' : 'Confirm delete'} "${cvTitle}"` : (b.deleteBtn || 'Delete')}
        onBlur={() => setTimeout(() => setConfirm(false), 300)}
      >
        {deleting ? '⟳' : confirm ? (isRTL ? '✕ تأكيد' : '✕ Confirm') : '🗑'}
      </button>
    </>
  )
}
