'use client'
// components/builder/ResizeHandle.tsx
import { forwardRef } from 'react'

interface Props {
  isDragging:    boolean
  onMouseDown:   (e: React.MouseEvent)  => void
  onTouchStart:  (e: React.TouchEvent)  => void
  onDoubleClick: () => void
}

export const ResizeHandle = forwardRef<HTMLDivElement, Props>(
  ({ isDragging, onMouseDown, onTouchStart, onDoubleClick }, ref) => (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onDoubleClick}
      title="اسحب لتغيير الحجم · انقر مرتين للإعادة"
      className={[
        'group flex-shrink-0 relative select-none w-[5px] cursor-col-resize transition-colors duration-100',
        isDragging ? 'bg-yellow-500/50' : 'bg-white/[0.05] hover:bg-yellow-500/25',
      ].join(' ')}
      style={{ touchAction: 'none' }}
    >
      {/* Pill indicator */}
      <div className={[
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        'w-[3px] rounded-full transition-all duration-150',
        isDragging
          ? 'h-14 bg-yellow-400 shadow-[0_0_10px_rgba(201,168,76,0.7)]'
          : 'h-7 bg-white/15 group-hover:h-12 group-hover:bg-yellow-400/50',
      ].join(' ')} />

      {/* Extended hit area (invisible, 10px wide) */}
      <div className="absolute inset-y-0 -left-[3px] -right-[3px]" />
    </div>
  )
)
ResizeHandle.displayName = 'ResizeHandle'
