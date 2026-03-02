'use client'
// components/builder/widgets/DateRangePicker.tsx
import { useState, useRef, useEffect } from 'react'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const NOW = new Date()
const YEARS = Array.from({length:35},(_,i)=>NOW.getFullYear()-i)

function parseDateStr(str: string, months: string[]) {
  if (!str) return { month: -1, year: -1 }
  const parts = str.trim().split(' ')
  if (parts.length === 2) {
    const mi = months.findIndex(m => m.toLowerCase() === parts[0].toLowerCase())
    const y = parseInt(parts[1])
    return { month: mi, year: isNaN(y) ? -1 : y }
  }
  const y = parseInt(parts[0])
  return { month: -1, year: isNaN(y) ? -1 : y }
}

function buildDateStr(m: number, y: number, months: string[]) {
  if (m >= 0 && y > 0) return `${months[m]} ${y}`
  if (y > 0) return String(y)
  return ''
}

function DateDropdown({ label, value, onChange, isEn, disabled }: {
  label: string; value: string; onChange: (v: string) => void; isEn: boolean; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const months = isEn ? MONTHS_EN : MONTHS_AR
  const { month, year } = parseDateStr(value, months)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const setMonth = (m: number) => {
    onChange(buildDateStr(m, year > 0 ? year : NOW.getFullYear(), months))
  }
  const setYear = (y: number) => {
    onChange(buildDateStr(month, y, months))
    setOpen(false)
  }

  const display = value && !disabled ? value : disabled ? (isEn ? 'Present' : 'حتى الآن') : (isEn ? 'Select…' : 'اختر…')

  return (
    <div className="flex-1" ref={ref}>
      <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1.5">{label}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={[
          'w-full text-sm px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
          disabled ? 'border-white/5 bg-white/3 text-gray-700 cursor-not-allowed'
            : open ? 'border-yellow-500/50 bg-[#1C1C2A] text-white'
            : value ? 'border-white/12 bg-[#181824] text-white hover:border-white/20'
            : 'border-white/7 bg-[#13131E] text-gray-500 hover:border-white/14',
        ].join(' ')}
      >
        {display}
      </button>

      {open && (
        <div className="absolute z-[100] mt-1 bg-[#1A1A28] border border-white/12 rounded-2xl shadow-2xl shadow-black/50 p-3 w-52 end-0 sm:end-auto sm:start-0" dir="ltr">
          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1 mb-2.5">
            {months.map((m, i) => (
              <button key={m} onClick={() => setMonth(i)} className={[
                'text-[11px] py-1.5 rounded-lg transition-all',
                i === month ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold'
                  : 'text-gray-500 hover:bg-white/5 hover:text-white',
              ].join(' ')}>{m}</button>
            ))}
          </div>
          {/* Year list */}
          <div className="border-t border-white/8 pt-2 max-h-40 overflow-y-auto space-y-0.5">
            {YEARS.map(y => (
              <button key={y} onClick={() => setYear(y)} className={[
                'w-full text-left text-sm px-2.5 py-1 rounded-lg transition-all',
                y === year ? 'bg-yellow-500/20 text-yellow-400 font-bold' : 'text-gray-500 hover:bg-white/5 hover:text-white',
              ].join(' ')}>{y}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  startDate: string; endDate: string; isCurrent: boolean
  onStartChange:(v:string)=>void; onEndChange:(v:string)=>void; onCurrentChange:(v:boolean)=>void
  isEn: boolean
}

export function DateRangePicker({ startDate, endDate, isCurrent, onStartChange, onEndChange, onCurrentChange, isEn }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-3 relative">
        <DateDropdown label={isEn?'From':'من'} value={startDate} onChange={onStartChange} isEn={isEn} />
        <DateDropdown label={isEn?'To':'إلى'} value={endDate} onChange={onEndChange} isEn={isEn} disabled={isCurrent} />
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
        <div onClick={() => onCurrentChange(!isCurrent)} className={`w-9 h-5 rounded-full transition-all duration-200 flex items-center px-0.5 ${isCurrent?'bg-yellow-500':'bg-white/10'}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${isCurrent?'translate-x-4':'translate-x-0'}`} />
        </div>
        <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">{isEn?'Currently working here':'لا زلت أعمل هنا'}</span>
      </label>
    </div>
  )
}
