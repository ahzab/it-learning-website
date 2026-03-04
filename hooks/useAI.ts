// hooks/useAI.ts
// Wrapper around the AI streaming endpoint.
// Separates raw error CODE (for modal routing) from human-readable message.
import { useState, useCallback } from 'react'

interface UseAIOptions {
  onComplete?: (text: string) => void
}

// Error codes returned by the server guard
export type AIErrorCode =
  | 'AI_CREDITS_EXHAUSTED'
  | 'PLAN_UPGRADE_REQUIRED'
  | 'NETWORK_ERROR'
  | string

export interface AIError {
  code:    AIErrorCode
  message: string
}

export function useAI({ onComplete }: UseAIOptions = {}) {
  const [loading,   setLoading]   = useState(false)
  const [streaming, setStreaming] = useState('')
  const [aiError,   setAiError]   = useState<AIError | null>(null)

  // Keep a string alias for components that still use error as a string
  const error = aiError?.message ?? null

  const clearError = useCallback(() => setAiError(null), [])

  const run = useCallback(
    async (action: string, context: Record<string, any>) => {
      setLoading(true)
      setStreaming('')
      setAiError(null)

      try {
        const res = await fetch('/api/ai', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action, context }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const code    = data.error || 'GENERIC_ERROR'
          const message = data.message || data.error || 'حدث خطأ'
          setAiError({ code, message })
          setLoading(false)
          return
        }

        const reader  = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullText  = ''

        if (!reader) {
          setAiError({ code: 'NETWORK_ERROR', message: 'لا يمكن قراءة الاستجابة' })
          setLoading(false)
          return
        }

        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'delta' && parsed.text) {
                fullText += parsed.text
                setStreaming(fullText)
              }
              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text || ''
                fullText += text
                setStreaming(fullText)
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        onComplete?.(fullText)
      } catch {
        setAiError({ code: 'NETWORK_ERROR', message: 'تعذر الاتصال بالذكاء الاصطناعي' })
      } finally {
        setLoading(false)
      }
    },
    [onComplete],
  )

  return { run, loading, streaming, error, aiError, clearError, setStreaming }
}
