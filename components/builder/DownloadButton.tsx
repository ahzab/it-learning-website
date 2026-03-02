// components/builder/DownloadButton.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function DownloadButton() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDownload = async () => {
    if (!session) {
      router.push('/auth/register')
      return
    }

    // Check plan
    const userPlan = (session.user as any).plan
    if (userPlan === 'FREE') {
      router.push('/pricing')
      return
    }

    setLoading(true)
    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.getElementById('cv-to-print')
      if (!element) return

      const opt = {
        margin: 0,
        filename: 'سيرتي-الذاتية.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="bg-yellow-500 text-black px-3 sm:px-5 py-2 rounded-lg text-sm font-black hover:bg-yellow-400 active:bg-yellow-600 transition-all disabled:opacity-50 flex items-center gap-1.5 min-h-[36px]"
    >
      {loading ? (
        <span className="animate-spin text-base">⟳</span>
      ) : (
        <span className="text-base leading-none">⬇</span>
      )}
      <span className="hidden sm:inline">
        {session && (session.user as any)?.plan !== 'FREE' ? 'تحميل PDF' : 'تحميل — $7'}
      </span>
    </button>
  )
}
