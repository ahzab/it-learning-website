// components/builder/PhotoUpload.tsx
'use client'
import React, { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useCVStore } from '@/lib/store'
import { useT } from '@/lib/i18n/context'

export function PhotoUpload() {
  const photo = useCVStore((s) => s.cv.personal.photo)
  const updatePersonal = useCVStore((s) => s.updatePersonal)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const { t } = useT()
  const b = t.builder

  const processFile = (file: File) => {
    setError('')

    if (!file.type.startsWith('image/')) {
      setError(b.photoErrorType)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(b.photoErrorSize)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 300
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        updatePersonal({ photo: dataUrl })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const removePhoto = () => {
    updatePersonal({ photo: undefined })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-2 font-semibold">
        {b.photoLabel}
        <span className="text-gray-600 font-normal mr-2">{b.photoOptional}</span>
      </label>

      {photo ? (
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={photo}
              alt={b.photoLabel}
              className="w-20 h-20 rounded-full object-cover border-2 border-yellow-500/40"
            />
            <button
              onClick={removePhoto}
              className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-400 transition-colors leading-none"
              title={b.deleteBtn}
            >
              ×
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-300 font-semibold">{b.photoUploaded}</p>
            <p className="text-xs text-gray-600 mt-1">{b.photoSize}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-yellow-400 hover:text-yellow-300 mt-2 transition-colors"
            >
              {b.photoChange}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-white/15 hover:border-yellow-500/50 hover:bg-yellow-500/5 active:bg-yellow-500/8'
          }`}
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm text-gray-300 font-semibold">
            <span className="sm:hidden">{b.photoClickMobile}</span>
            <span className="hidden sm:inline">{b.photoClickDesktop}</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">{b.photoFormat}</p>
        </button>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <div className="mt-3 bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2.5">
        <p className="text-xs text-gray-500 leading-relaxed">{b.photoTip}</p>
      </div>
    </div>
  )
}
