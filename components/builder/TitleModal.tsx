'use client'
import React, { type ChangeEvent, type FormEvent } from 'react'
// components/builder/TitleModal.tsx
// Floating modal to rename the CV title

import { useState, useEffect, useRef } from 'react'

interface Props {
  title: string
  isEn: boolean
  onClose: () => void
  onSave: (t: string) => void
}

export function TitleModal({ title, isEn, onClose, onSave }: Props) {
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) { onSave(value.trim()); onClose() }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-black mb-4">
          {isEn ? 'Rename CV' : 'تسمية السيرة الذاتية'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isEn ? 'My CV — Software Developer' : 'سيرتي — مطور برمجيات'}
            className="w-full bg-[#1A1A26] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500 focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition-colors"
            >
              {isEn ? 'Cancel' : 'إلغاء'}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-colors disabled:opacity-40"
            >
              {isEn ? 'Save' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
