// components/builder/ai/AIAssistantPanel.tsx
'use client'
import { useState } from 'react'
import { useCVStore } from '@/lib/store'
import { useAI } from '@/hooks/useAI'

type QuickAction = {
  id: string
  label: string
  icon: string
  action: string
  desc: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'generate_summary', icon: '✍️', label: 'اكتب نبذتي', desc: 'أنشئ نبذة شخصية كاملة', action: 'generate_summary' },
  { id: 'improve_summary', icon: '✨', label: 'حسّن النبذة', desc: 'اجعل نبذتك أكثر تأثيراً', action: 'improve_summary' },
  { id: 'suggest_skills', icon: '⚡', label: 'اقترح مهارات', desc: 'مهارات تناسب تخصصك', action: 'suggest_skills' },
  { id: 'full_review', icon: '📋', label: 'راجع سيرتي', desc: 'تقييم شامل مع توصيات', action: 'full_review' },
]

export function AIAssistantPanel() {
  const { cv, updatePersonal, addSkill } = useCVStore()
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set())

  const { run, loading, streaming, error, setStreaming } = useAI({
    onComplete: () => {},
  })

  const getContext = () => ({
    name: cv.personal.fullName,
    jobTitle: cv.personal.jobTitle,
    summary: cv.personal.summary,
    experiences: cv.experience.map(e => `${e.jobTitle} في ${e.company}: ${e.description}`).join('\n'),
    currentSkills: cv.skills.map(s => s.name).join(', '),
    skills: cv.skills.map(s => s.name).join(', '),
    yearsExp: cv.experience.length > 0 ? `${cv.experience.length * 2}+` : '0',
    market: cv.country === 'MA' ? 'مغربي' : cv.country === 'AE' || cv.country === 'SA' || cv.country === 'QA' ? 'خليجي' : 'عربي عام',
  })

  const handleAction = async (qa: QuickAction) => {
    setActiveAction(qa.id)
    setStreaming('')
    await run(qa.action, getContext())
  }

  const applyResult = (actionId: string, text: string) => {
    if (actionId === 'improve_summary' || actionId === 'generate_summary') {
      updatePersonal({ summary: text.trim() })
    } else if (actionId === 'suggest_skills') {
      const skills = text.split('\n').map(s => s.trim()).filter(s => s && s.length > 1 && s.length < 50)
      skills.slice(0, 8).forEach(skill => addSkill(skill))
    }
    setAppliedActions(prev => new Set([...prev, actionId]))
    setActiveAction(null)
    setStreaming('')
  }

  const isComplete = !loading && streaming.length > 0

  return (
    <div className="h-full flex flex-col bg-[#0D0D18]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-purple-400 text-lg">✦</span>
          <h3 className="font-black text-sm text-white">مساعد الذكاء الاصطناعي</h3>
        </div>
        <p className="text-xs text-gray-600">يساعدك على كتابة سيرة ذاتية احترافية</p>
      </div>

      {/* CV strength meter */}
      <div className="px-5 py-4 border-b border-white/6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500">قوة سيرتك</span>
          <span className="text-xs font-bold text-yellow-400">{calcStrength(cv)}%</span>
        </div>
        <div className="h-1.5 bg-white/6 rounded-full">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${calcStrength(cv)}%`,
              background: calcStrength(cv) < 40 ? '#ef4444' : calcStrength(cv) < 70 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">{getStrengthTip(cv)}</p>
      </div>

      {/* Quick actions */}
      <div className="px-5 py-4 border-b border-white/6">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">إجراءات سريعة</p>
        <div className="space-y-2">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.id}
              onClick={() => handleAction(qa)}
              disabled={loading}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-all border ${
                activeAction === qa.id
                  ? 'border-purple-500/50 bg-purple-500/15'
                  : appliedActions.has(qa.id)
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-white/6 bg-white/3 hover:border-purple-500/30 hover:bg-purple-500/8'
              } disabled:opacity-50`}
            >
              <span className="text-lg flex-shrink-0">{qa.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-200">{qa.label}</div>
                <div className="text-xs text-gray-600">{qa.desc}</div>
              </div>
              {appliedActions.has(qa.id) && !activeAction && (
                <span className="text-green-400 text-xs">✓</span>
              )}
              {activeAction === qa.id && loading && (
                <span className="text-purple-400 text-xs animate-spin">✦</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Result area */}
      {(streaming || error) && (
        <div className="flex-1 px-5 py-4 overflow-y-auto pb-safe">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-purple-400 font-bold flex items-center gap-1.5">
              <span className={loading ? 'animate-pulse' : ''}>✦</span>
              {loading ? 'جاري التفكير...' : 'الاقتراح جاهز'}
            </span>
            {!loading && (
              <button
                onClick={() => { setActiveAction(null); setStreaming('') }}
                className="text-gray-600 hover:text-gray-400 text-xs"
              >
                مسح ×
              </button>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">
              {error}
            </div>
          )}

          {streaming && (
            <div className="bg-[#111] border border-white/6 rounded-xl p-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap mb-4">
              {streaming}
              {loading && (
                <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse mr-1 align-middle" />
              )}
            </div>
          )}

          {isComplete && activeAction && (
            <div className="space-y-2">
              {(activeAction === 'improve_summary' || activeAction === 'generate_summary') && (
                <button
                  onClick={() => applyResult(activeAction, streaming)}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl text-sm font-black hover:bg-purple-500 transition-colors"
                >
                  ✓ تطبيق على النبذة الشخصية
                </button>
              )}
              {activeAction === 'suggest_skills' && (
                <button
                  onClick={() => applyResult(activeAction, streaming)}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl text-sm font-black hover:bg-purple-500 transition-colors"
                >
                  ✓ إضافة المهارات المقترحة
                </button>
              )}
              <button
                onClick={() => handleAction(QUICK_ACTIONS.find(q => q.id === activeAction)!)}
                className="w-full border border-white/10 text-gray-400 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors"
              >
                ↻ إعادة المحاولة
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips when idle */}
      {!streaming && !error && (
        <div className="flex-1 px-5 py-4 overflow-y-auto pb-safe">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">نصائح سريعة</p>
          <div className="space-y-2.5">
            {[
              { icon: '📊', tip: 'أضف أرقاماً وإحصاءات لخبراتك (زدت المبيعات بنسبة 30%)' },
              { icon: '🎯', tip: 'استهدف الوظيفة المحددة وليس عموم الوظائف' },
              { icon: '🔑', tip: 'استخدم كلمات مفتاحية من إعلان الوظيفة' },
              { icon: '📱', tip: 'تأكد من أن بريدك ورقم هاتفك محدّثان' },
            ].map((t, i) => (
              <div key={i} className="flex gap-2.5 text-xs text-gray-500">
                <span className="text-sm flex-shrink-0">{t.icon}</span>
                <p className="leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helpers
function calcStrength(cv: any): number {
  let score = 0
  if (cv.personal.fullName) score += 10
  if (cv.personal.jobTitle) score += 10
  if (cv.personal.email) score += 10
  if (cv.personal.phone) score += 5
  if (cv.personal.location) score += 5
  if (cv.personal.summary && cv.personal.summary.length > 50) score += 20
  if (cv.experience.length > 0) score += 15
  if (cv.experience.length > 1) score += 5
  if (cv.education.length > 0) score += 10
  if (cv.skills.length >= 5) score += 10
  if (cv.languages.length > 0) score += 5
  if (cv.certificates.length > 0) score += 5
  return Math.min(score, 100)
}

function getStrengthTip(cv: any): string {
  if (!cv.personal.fullName) return 'ابدأ بإضافة اسمك الكامل'
  if (!cv.personal.summary) return 'أضف نبذة شخصية لزيادة قوة سيرتك'
  if (cv.experience.length === 0) return 'أضف خبراتك المهنية'
  if (cv.skills.length < 5) return 'أضف المزيد من المهارات'
  if (cv.languages.length === 0) return 'أضف اللغات التي تتقنها'
  return 'سيرتك في حالة ممتازة! ✓'
}
