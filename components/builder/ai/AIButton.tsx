// components/builder/ai/AIButton.tsx
'use client'
import { useState } from 'react'
import { useAI } from '@/hooks/useAI'
import { useT } from '@/lib/i18n/context'

interface Props {
  action: string
  context: Record<string, any>
  label?: string
  onApply: (text: string) => void
  disabled?: boolean
}

export function AIButton({ action, context, label, onApply, disabled }: Props) {
  const [showPanel, setShowPanel] = useState(false)
  const [result, setResult] = useState('')
  const { t } = useT()
  const b = t.builder

  const { run, loading, streaming, error } = useAI({
    onComplete: (text) => setResult(text),
  })

  const handleRun = async () => {
    setShowPanel(true)
    setResult('')
    await run(action, context)
  }

  const handleApply = () => {
    onApply(result || streaming)
    setShowPanel(false)
    setResult('')
  }

  const buttonLabel = label ?? b.aiImproveLabel

  return (
    <div>
      <button
        onClick={handleRun}
        disabled={disabled || loading}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50 font-semibold"
      >
        {loading ? (
          <>
            <span className="animate-spin text-sm">✦</span>
            {b.aiImproving}
          </>
        ) : (
          <>
            <span>✦</span>
            {buttonLabel}
          </>
        )}
      </button>

      {showPanel && (
        <div className="mt-3 bg-[#1A1A2E] border border-purple-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-400 font-bold flex items-center gap-1.5">
              <span className={loading ? 'animate-pulse' : ''}>✦</span>
              {b.aiSuggestion}
            </span>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-600 hover:text-gray-400 text-xs"
            >
              {b.aiClose}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {(streaming || result) && (
            <div className="bg-[#111] rounded-lg p-3 text-sm text-gray-200 leading-relaxed min-h-[60px] whitespace-pre-wrap">
              {result || streaming}
              {loading && <span className="inline-block w-1 h-4 bg-purple-400 animate-pulse mr-1 align-middle" />}
            </div>
          )}

          {!loading && (result || streaming) && (
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-500 transition-colors"
              >
                {b.aiApply}
              </button>
              <button
                onClick={handleRun}
                className="px-4 bg-white/5 text-gray-300 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                {b.aiRetry}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
