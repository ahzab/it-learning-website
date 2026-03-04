'use client'
import { useState } from 'react'
import { useCVStore } from '@/lib/store'
import { useT }       from '@/lib/i18n/context'
import { useAI }      from '@/hooks/useAI'
import { AIErrorModal } from '@/components/ui/AIErrorModal'

export function AIAssistantPanel() {
  const { cv, updatePersonal, addSkill } = useCVStore()
  const { t, isRTL } = useT()
  const b = t.builder

  const [activeAction,   setActiveAction]   = useState<string | null>(null)
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set())

  const { run, loading, streaming, aiError, clearError, setStreaming } = useAI({ onComplete: () => {} })

  const QUICK_ACTIONS = [
    { id: 'generate_summary', icon: '✍️', label: b.actionGenerateSummaryLabel, desc: b.actionGenerateSummaryDesc, action: 'generate_summary' },
    { id: 'improve_summary',  icon: '✨', label: b.actionImproveSummaryLabel,  desc: b.actionImproveSummaryDesc,  action: 'improve_summary' },
    { id: 'suggest_skills',   icon: '⚡', label: b.actionSuggestSkillsLabel,   desc: b.actionSuggestSkillsDesc,   action: 'suggest_skills' },
    { id: 'full_review',      icon: '📋', label: b.actionFullReviewLabel,      desc: b.actionFullReviewDesc,      action: 'full_review' },
  ]

  const getContext = () => ({
    name:         cv.personal.fullName,
    jobTitle:     cv.personal.jobTitle,
    summary:      cv.personal.summary,
    experiences:  cv.experience.map(e => `${e.jobTitle} @ ${e.company}: ${e.description}`).join('\n'),
    currentSkills:cv.skills.map(s => s.name).join(', '),
    skills:       cv.skills.map(s => s.name).join(', '),
  })

  const handleAction = async (action: typeof QUICK_ACTIONS[0]) => {
    setActiveAction(action.id)
    setStreaming('')
    await run(action.action, getContext())
  }

  const applyResult = (actionId: string, text: string) => {
    if (!text.trim()) return
    if (actionId === 'improve_summary' || actionId === 'generate_summary') {
      updatePersonal({ summary: text.trim() })
    }
    if (actionId === 'suggest_skills') {
      const lines = text.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
      lines.slice(0, 8).forEach(name => addSkill({ name, level: 'intermediate' }))
    }
    setAppliedActions(prev => new Set(prev).add(actionId))
    setStreaming('')
    setActiveAction(null)
  }

  const isComplete = !loading && streaming.length > 0

  // Determine if the error is a known AI gate error (show modal) or generic (show inline)
  const isGateError = aiError?.code === 'AI_CREDITS_EXHAUSTED' || aiError?.code === 'PLAN_UPGRADE_REQUIRED'
  const isNetworkError = aiError && !isGateError

  return (
    <div className="h-full flex flex-col bg-[#0D0D18] border-l border-white/8">

      {/* AI gate error modal - credits/plan */}
      {aiError && isGateError && (
        <AIErrorModal
          code={aiError.code}
          message={aiError.message}
          onClose={clearError}
          onRetry={undefined}
        />
      )}

      {/* Panel header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
        <span className="text-purple-400 text-base">✦</span>
        <span className="text-sm font-black text-white">{b.aiAssistant}</span>
        <span className="ms-auto text-xs text-gray-600">{b.aiPowered}</span>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4 border-b border-white/5 grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            disabled={loading}
            className={[
              'flex flex-col items-start gap-1 p-3 rounded-xl text-start border transition-all text-xs',
              activeAction === action.id && (loading || isComplete)
                ? 'border-purple-500/50 bg-purple-500/10 text-white'
                : appliedActions.has(action.id)
                ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400'
                : 'border-white/8 hover:border-purple-500/30 hover:bg-purple-500/5 text-gray-400 hover:text-white',
              loading ? 'cursor-wait opacity-60' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="text-base leading-none">{action.icon}</span>
            <span className="font-bold leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Result area */}
      {(streaming || isNetworkError) && (
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-purple-400 font-bold flex items-center gap-1.5">
              <span className={loading ? 'animate-pulse' : ''}>✦</span>
              {loading ? b.thinking : b.resultReady}
            </span>
            {!loading && (
              <button onClick={() => { setActiveAction(null); setStreaming('') }} className="text-gray-600 hover:text-gray-400 text-xs">
                {b.clearResult}
              </button>
            )}
          </div>

          {/* Generic network error — shown inline (not a gate error) */}
          {isNetworkError && (
            <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-xl p-3.5 mb-3">
              <span className="text-red-400 text-lg flex-shrink-0">⚠</span>
              <div>
                <div className="text-red-400 text-xs font-bold mb-1">
                  {isRTL ? 'تعذر الاتصال' : 'Connection failed'}
                </div>
                <div className="text-red-300/70 text-xs">{aiError?.message}</div>
                <button
                  onClick={clearError}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                >
                  {isRTL ? 'حاول مرة أخرى' : 'Try again'}
                </button>
              </div>
            </div>
          )}

          {streaming && (
            <div className="bg-[#111] border border-white/6 rounded-xl p-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap mb-4">
              {streaming}
              {loading && <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse mx-1 align-middle" />}
            </div>
          )}

          {isComplete && activeAction && (
            <div className="space-y-2">
              {(activeAction === 'improve_summary' || activeAction === 'generate_summary') && (
                <button onClick={() => applyResult(activeAction, streaming)}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl text-sm font-black hover:bg-purple-500 transition-colors">
                  {b.applyToSummary}
                </button>
              )}
              {activeAction === 'suggest_skills' && (
                <button onClick={() => applyResult(activeAction, streaming)}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl text-sm font-black hover:bg-purple-500 transition-colors">
                  {b.addSuggestedSkills}
                </button>
              )}
              <button onClick={() => handleAction(QUICK_ACTIONS.find(q => q.id === activeAction)!)}
                className="w-full border border-white/10 text-gray-400 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
                {b.retry}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips when idle */}
      {!streaming && !aiError && (
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">{b.tipsLabel}</p>
          <div className="space-y-2.5">
            {[
              { icon: '📊', tip: b.tip1 },
              { icon: '🎯', tip: b.tip2 },
              { icon: '✍️', tip: b.tip3 },
            ].map(({ icon, tip }) => (
              <div key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="flex-shrink-0 mt-0.5">{icon}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
