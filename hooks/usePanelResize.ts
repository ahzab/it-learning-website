'use client'
// hooks/usePanelResize.ts
// Drag-to-resize for the builder's side panels.
// Persists sizes to localStorage. Exposes setSize() so external
// controls (quick-size pills) can drive the value too.

import { useState, useRef, useCallback, useEffect } from 'react'

export interface PanelResizeOptions {
  storageKey:  string
  defaultSize: number
  min:         number
  max:         number
  /**
   * 'shrink-left'  – handle sits on the LEFT edge of the panel.
   *                  Drag left  → smaller, drag right → bigger.
   *                  Used for panels on the RIGHT side of the layout
   *                  (and on the LEFT side in RTL).
   * 'shrink-right' – handle sits on the RIGHT edge of the panel.
   *                  Drag right → smaller, drag left → bigger.
   */
  direction?: 'shrink-left' | 'shrink-right'
}

export interface PanelResizeReturn {
  size:         number
  isDragging:   boolean
  setSize:      (px: number) => void
  onMouseDown:  (e: React.MouseEvent) => void
  onTouchStart: (e: React.TouchEvent) => void
  resetSize:    () => void
}

function readStorage(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    if (v !== null) { const n = parseInt(v, 10); if (!isNaN(n)) return n }
  } catch {}
  return fallback
}

export function usePanelResize({
  storageKey,
  defaultSize,
  min,
  max,
  direction = 'shrink-left',
}: PanelResizeOptions): PanelResizeReturn {
  const [size, _setSize]          = useState(() => readStorage(storageKey, defaultSize))
  const [isDragging, setDragging] = useState(false)
  const startX                    = useRef(0)
  const startSize                 = useRef(0)
  const rafId                     = useRef<number>(0)

  const clamp = useCallback((v: number) => Math.max(min, Math.min(max, Math.round(v))), [min, max])

  const setSize = useCallback((px: number) => {
    const clamped = clamp(px)
    _setSize(clamped)
    try { localStorage.setItem(storageKey, String(clamped)) } catch {}
  }, [clamp, storageKey])

  const resetSize = useCallback(() => setSize(defaultSize), [setSize, defaultSize])

  const onMove = useCallback((clientX: number) => {
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      // shrink-left: handle on left edge → drag right (clientX↑) = grow
      const delta = direction === 'shrink-left'
        ? clientX - startX.current
        : startX.current - clientX
      setSize(startSize.current + delta)
    })
  }, [direction, setSize])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startX.current    = e.clientX
    startSize.current = size
    setDragging(true)

    const move = (ev: MouseEvent) => onMove(ev.clientX)
    const up   = () => {
      setDragging(false)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup',   up)
      cancelAnimationFrame(rafId.current)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup',   up)
  }, [size, onMove])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    startX.current    = t.clientX
    startSize.current = size
    setDragging(true)

    const move = (ev: TouchEvent) => onMove(ev.touches[0].clientX)
    const end  = () => {
      setDragging(false)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend',  end)
      cancelAnimationFrame(rafId.current)
    }
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend',  end)
  }, [size, onMove])

  // Global cursor during drag
  useEffect(() => {
    document.body.style.cursor = isDragging ? 'col-resize' : ''
    return () => { document.body.style.cursor = '' }
  }, [isDragging])

  return { size, isDragging, setSize, onMouseDown, onTouchStart, resetSize }
}
