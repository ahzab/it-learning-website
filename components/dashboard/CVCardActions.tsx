'use client'
// components/dashboard/CVCardActions.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  cvId: string
  cvTitle: string
}

export function CVCardActions({ cvId, cvTitle }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)

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

  return (
    <div className="flex gap-2">
      <a
        href={`/builder?id=${cvId}`}
        className="flex-1 text-center bg-yellow-500/15 text-yellow-400 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500/25 transition-colors"
      >
        تعديل
      </a>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
          confirm
            ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
            : 'bg-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-400'
        } disabled:opacity-40`}
        title={confirm ? `تأكيد حذف "${cvTitle}"` : 'حذف'}
        onBlur={() => setTimeout(() => setConfirm(false), 300)}
      >
        {deleting ? '⟳' : confirm ? '✕ تأكيد' : '🗑'}
      </button>
    </div>
  )
}
