'use client'
// components/linkedin/LinkedInImportButton.tsx
// Small trigger that opens the LinkedInImport modal.
// Used in PersonalForm (builder) and Dashboard.

import { useState } from 'react'
import { LinkedInImport } from './LinkedInImport'

interface Props {
  isEn?: boolean
  variant?: 'banner' | 'compact' | 'pill'
}

export function LinkedInImportButton({ isEn, variant = 'banner' }: Props) {
  const [open, setOpen] = useState(false)

  if (variant === 'pill') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#0A66C2]/35 text-[#70B5F9] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/60 transition-all font-bold"
        >
          <LinkedInMark />
          {isEn ? 'Import from LinkedIn' : 'استيراد من LinkedIn'}
        </button>
        {open && <LinkedInImport isEn={isEn} onClose={() => setOpen(false)} />}
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#0A66C2]/25 hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/8 transition-all group"
        >
          <LinkedInMark />
          <span className="text-xs text-[#70B5F9] font-bold">
            {isEn ? 'Import LinkedIn' : 'استيراد من LinkedIn'}
          </span>
        </button>
        {open && <LinkedInImport isEn={isEn} onClose={() => setOpen(false)} />}
      </>
    )
  }

  // Banner — full-width, used in PersonalForm
  return (
    <>
      <div className="rounded-xl border border-[#0A66C2]/25 bg-[#0A66C2]/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/15 border border-[#0A66C2]/30 flex items-center justify-center flex-shrink-0">
              <LinkedInIcon />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                {isEn ? 'Import from LinkedIn' : 'استيراد من LinkedIn'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {isEn
                  ? 'Auto-fill your CV with your LinkedIn profile data'
                  : 'املأ سيرتك تلقائياً ببياناتك من LinkedIn'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#0D7BE5] active:bg-[#085DAB] text-white text-xs font-black transition-all whitespace-nowrap shadow-md shadow-[#0A66C2]/25 flex-shrink-0"
          >
            <LinkedInMark white />
            {isEn ? 'Import' : 'استيراد'}
          </button>
        </div>
      </div>

      {open && <LinkedInImport isEn={isEn} onClose={() => setOpen(false)} />}
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function LinkedInIcon({ white }: { white?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={white ? 'white' : '#0A66C2'}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function LinkedInMark({ white }: { white?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={white ? 'white' : '#70B5F9'}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
