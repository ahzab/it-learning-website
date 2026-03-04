'use client'
// components/ui/AIErrorModal.tsx
// Modal overlay for AI errors (credits exhausted, plan required, generic).
// Replaces full-page error stages — keeps the current page visible behind.

import { useT } from '@/lib/i18n/context'

export type AIErrorCode =
  | 'AI_CREDITS_EXHAUSTED'
  | 'PLAN_REQUIRED'
  | 'NETWORK_ERROR'
  | string

interface Props {
  code:    AIErrorCode
  message?: string       // raw server message, shown as fallback detail
  onClose: () => void
  onRetry?: () => void
}

export function AIErrorModal({ code, message, onClose, onRetry }: Props) {
  const { t, isRTL } = useT()
  const b = t.builder

  const isCredits = code === 'AI_CREDITS_EXHAUSTED'
  const isPlan    = code === 'PLAN_REQUIRED'

  const icon    = isCredits ? '🪫' : isPlan ? '🔒' : '⚠️'
  const heading = isCredits
    ? (isRTL ? 'نفدت أرصدة الذكاء الاصطناعي' : 'AI credits exhausted')
    : isPlan
    ? (isRTL ? 'هذه الميزة تتطلب خطة أعلى' : 'Upgrade required')
    : (isRTL ? 'حدث خطأ' : 'Something went wrong')

  const detail = isCredits
    ? (isRTL
        ? 'لقد استنفدت رصيدك للذكاء الاصطناعي في هذه الخطة. يمكنك الترقية للحصول على المزيد.'
        : 'You\'ve used all your AI credits on this plan. Upgrade to get more.')
    : isPlan
    ? (isRTL
        ? 'هذه الميزة متاحة في خطة المبتدئ أو الاحترافي.'
        : 'This feature is available on the Starter or Pro plan.')
    : message || (isRTL ? 'حاول مرة أخرى أو أعد تحميل الصفحة.' : 'Please try again or refresh the page.')

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#111118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Colour stripe */}
        <div className={`h-1 ${isCredits || isPlan ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} />

        <div className="p-6">
          {/* Icon + heading */}
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl flex-shrink-0 leading-none">{icon}</div>
            <div>
              <h3 className="text-base font-black text-white mb-1">{heading}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{detail}</p>
            </div>
          </div>

          {/* Credit meter for exhausted state */}
          {isCredits && (
            <div className="bg-white/4 rounded-xl p-3 mb-5 border border-white/6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{isRTL ? 'الأرصدة المستهلكة' : 'Credits used'}</span>
                <span className="text-xs font-bold text-amber-400">100%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {isRTL
                  ? '✦ خطة المبتدئ: ٢٠ رصيد — خطة الاحترافي: غير محدود'
                  : '✦ Starter plan: 20 credits — Pro plan: unlimited'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {(isCredits || isPlan) && (
              <a
                href="/api/payment/checkout?plan=STARTER"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 hover:from-yellow-400 hover:to-amber-300 transition-all shadow-lg shadow-yellow-500/15"
              >
                🚀 {isRTL ? 'ترقية الخطة — $4.99' : 'Upgrade plan — $4.99'}
              </a>
            )}
            {(isCredits || isPlan) && (
              <a
                href="/api/payment/checkout?plan=PRO"
                className="w-full py-2.5 rounded-xl bg-white/4 border border-white/10 text-gray-300 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/8 transition-all"
              >
                ⚡ {isRTL ? 'الاحترافي — ذكاء غير محدود ($12/شهر)' : 'Pro — unlimited AI ($12/mo)'}
              </a>
            )}
            {onRetry && !isCredits && !isPlan && (
              <button
                onClick={() => { onClose(); onRetry() }}
                className="w-full py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-sm font-bold hover:bg-yellow-500/18 transition-all"
              >
                {isRTL ? '↺ حاول مرة أخرى' : '↺ Try again'}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-white/8 text-gray-500 text-sm hover:text-gray-300 hover:border-white/15 transition-all"
            >
              {isRTL ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
