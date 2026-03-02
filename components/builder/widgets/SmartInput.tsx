'use client'
// components/builder/widgets/SmartInput.tsx
import { useState, useRef } from 'react'

interface Props {
  label:       string
  value:       string
  onChange:    (v: string) => void
  onBlur?:     () => void
  placeholder?: string
  type?:       string
  dir?:        'rtl' | 'ltr' | 'auto'
  icon?:       string
  maxLength?:  number
  hint?:       string
  error?:      string
  multiline?:  boolean
  rows?:       number
  className?:  string
  onEnter?:    () => void
}

export function SmartInput({
  label, value, onChange, onBlur, placeholder, type = 'text', dir = 'auto',
  icon, maxLength, hint, error, multiline, rows = 3, className = '', onEnter,
}: Props) {
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const filled    = value.length > 0
  const floating  = focused || filled
  const overLimit = maxLength ? value.length > maxLength * 0.85 : false
  const hasError  = !!error

  const border = hasError
    ? 'border-red-500/50 bg-red-500/5'
    : focused
    ? 'border-yellow-500/50 bg-[#1C1C2A] shadow-[0_0_0_3px_rgba(201,168,76,0.07)]'
    : filled
    ? 'border-white/12 bg-[#181824]'
    : 'border-white/7 bg-[#13131E] hover:border-white/12 hover:bg-[#181824]'

  const labelPos = floating
    ? { top: '7px', fontSize: '10px', letterSpacing: '0.06em', color: hasError ? '#F87171' : focused ? '#C9A84C' : '#6B7280' }
    : { top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#4B5563' }

  const padL = icon && dir !== 'rtl' ? (floating ? '14px' : '38px') : '14px'
  const padR = icon && dir === 'rtl'  ? (floating ? '14px' : '38px') : '14px'
  const inputPad = { paddingTop: multiline ? '26px' : '20px', paddingBottom: '7px', paddingLeft: padL, paddingRight: padR }

  const inputClass = 'w-full bg-transparent text-sm text-white outline-none resize-none placeholder-transparent transition-all duration-200'

  const handleBlur = () => {
    setFocused(false)
    onBlur?.()
  }

  const sharedProps = {
    value,
    onChange:  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus:   () => setFocused(true),
    onBlur:    handleBlur,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !multiline) onEnter?.() },
    placeholder: placeholder || ' ',
    dir,
    className:  inputClass,
    style:      inputPad,
    ...(maxLength ? { maxLength } : {}),
  }

  const labelSide = dir === 'rtl' ? 'right-0 pr-4' : 'left-0 pl-4'
  const iconSide  = dir === 'rtl' ? 'right-3.5' : 'left-3.5'
  const iconShifted = icon && dir !== 'rtl' ? (floating ? 'pl-4' : 'pl-10') : ''
  const iconRtlShifted = icon && dir === 'rtl' ? (floating ? 'pr-4' : 'pr-10') : ''
  const counterSide = dir === 'rtl' ? 'left-3' : 'right-3'

  return (
    <div className={`space-y-1 ${className}`}>
      <div
        className={`relative rounded-xl border transition-all duration-200 cursor-text overflow-hidden ${border}`}
        onClick={() => (ref.current as HTMLInputElement | null)?.focus()}>
        <label
          className={`absolute pointer-events-none transition-all duration-200 font-semibold select-none z-10 ${labelSide} ${iconShifted} ${iconRtlShifted}`}
          style={labelPos as React.CSSProperties}>
          {label}
        </label>

        {icon && (
          <span className={`absolute top-1/2 -translate-y-1/2 text-sm pointer-events-none transition-all duration-200 ${iconSide} ${floating ? (focused ? 'text-yellow-400/60 scale-90' : 'text-gray-700') : 'text-gray-600'}`}>
            {icon}
          </span>
        )}

        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            {...sharedProps}
            rows={rows}
            style={{ ...inputPad, minHeight: rows * 22 + 34 }}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            type={type}
            {...sharedProps}
          />
        )}

        {maxLength && focused && (
          <span className={`absolute bottom-2 text-[10px] pointer-events-none ${counterSide} ${overLimit ? 'text-amber-400' : 'text-gray-700'}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {(hint || error) && (
        <p className={`text-xs pl-1 ${hasError ? 'text-red-400' : 'text-gray-600'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
