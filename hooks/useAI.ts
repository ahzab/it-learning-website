// hooks/useAI.ts
import { useState, useCallback } from 'react'

interface UseAIOptions {
  onComplete?: (text: string) => void
}

export function useAI({ onComplete }: UseAIOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (action: string, context: Record<string, any>) => {
      setLoading(true)
      setStreaming('')
      setError(null)

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, context }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'حدث خطأ')
          setLoading(false)
          return
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        if (!reader) {
          setError('لا يمكن قراءة الاستجابة')
          setLoading(false)
          return
        }

        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''   // keep incomplete last line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data || data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)

              // Unified format emitted by gemini.ts: { type: 'delta', text: '...' }
              if (parsed.type === 'delta' && parsed.text) {
                fullText += parsed.text
                setStreaming(fullText)
              }

              // Legacy Anthropic format (kept for backward compat during transition)
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
      } catch (err) {
        setError('تعذر الاتصال بالذكاء الاصطناعي')
      } finally {
        setLoading(false)
      }
    },
    [onComplete]
  )

  return { run, loading, streaming, error, setStreaming }
}
