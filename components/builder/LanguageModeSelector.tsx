// components/builder/LanguageModeSelector.tsx
'use client'
import { useState } from 'react'
import { useCVStore } from '@/lib/store'
import { CVMode } from '@/types/cv'

const MODES = [
  {
    id: 'ar' as CVMode,
    icon: '🇸🇦',
    label: 'عربي فقط',
    sub: 'Arabic only',
    desc: 'مثالي للسوق العربي والخليجي',
    descEn: 'Best for MENA & Gulf market',
    activeClass: 'border-emerald-500/50 bg-emerald-500/8',
    dotClass: 'bg-emerald-400',
    textActive: 'text-emerald-300',
    examples: ['🇸🇦 السعودية', '🇦🇪 الإمارات', '🇲🇦 المغرب', '🇪🇬 مصر'],
  },
  {
    id: 'en' as CVMode,
    icon: '🇬🇧',
    label: 'إنجليزي فقط',
    sub: 'English only',
    desc: 'للشركات الدولية والأجنبية',
    descEn: 'For international companies',
    activeClass: 'border-blue-500/50 bg-blue-500/8',
    dotClass: 'bg-blue-400',
    textActive: 'text-blue-300',
    examples: ['🇬🇧 UK', '🇺🇸 USA', '🇩🇪 Europe', '🌍 Remote'],
  },
  {
    id: 'bilingual' as CVMode,
    icon: '🌐',
    label: 'ثنائي اللغة',
    sub: 'عربي + English',
    desc: 'أقصى توافق مع كل الأسواق',
    descEn: 'Maximum reach across markets',
    activeClass: 'border-yellow-500/50 bg-yellow-500/8',
    dotClass: 'bg-yellow-400',
    textActive: 'text-yellow-300',
    badge: 'الأكثر شمولاً',
    examples: ['🌍 كل الأسواق', '🏢 متعدد الجنسيات'],
  },
]

interface ConfirmModalProps {
  from: CVMode
  to: CVMode
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ from, to, onConfirm, onCancel }: ConfirmModalProps) {
  const toMode = MODES.find(m => m.id === to)!
  const isBilingual = to === 'bilingual'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">

        {/* Icon */}
        <div className="text-4xl text-center mb-3">{toMode.icon}</div>

        {/* Title */}
        <h3 className="text-lg font-black text-center mb-1">
          {isBilingual ? 'تفعيل الوضع الثنائي' : `التبديل إلى ${toMode.label}`}
        </h3>
        <p className="text-sm text-gray-400 text-center mb-5">
          {isBilingual ? 'ستظهر حقول إضافية لكل قسم لإدخال النسخة الإنجليزية' : toMode.desc}
        </p>

        {/* What changes */}
        <div className="space-y-2 mb-5">
          {isBilingual ? (
            <>
              <InfoRow icon="✓" text="حقول مزدوجة: عربي + إنجليزي لكل قسم" green />
              <InfoRow icon="✓" text="زر ترجمة تلقائي بالذكاء الاصطناعي ✦" green />
              <InfoRow icon="✓" text="معاينة ثنائية اللغة في الوقت الحقيقي" green />
              <InfoRow icon="✓" text="البيانات الحالية محفوظة — لا شيء يُحذف" green />
              <InfoRow icon="•" text="وقت إضافي لملء الحقول الإنجليزية" />
            </>
          ) : to === 'en' ? (
            <>
              <InfoRow icon="✓" text="الحقول ستُعرض باللغة الإنجليزية" green />
              <InfoRow icon="✓" text="البيانات العربية محفوظة تلقائياً" green />
              <InfoRow icon="•" text="السيرة ستُصدَر باللغة الإنجليزية" />
            </>
          ) : (
            <>
              <InfoRow icon="✓" text="الحقول ستُعرض باللغة العربية" green />
              <InfoRow icon="✓" text="البيانات الإنجليزية محفوظة تلقائياً" green />
              <InfoRow icon="•" text="السيرة ستُصدَر باللغة العربية" />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:border-white/20 transition-colors">
            إلغاء
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              isBilingual ? 'bg-yellow-500 hover:bg-yellow-400 text-black' :
              to === 'en' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
              'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}>
            {isBilingual ? 'تفعيل الوضع الثنائي' : 'تطبيق'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, text, green }: { icon: string; text: string; green?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={green ? 'text-emerald-400 flex-shrink-0 mt-0.5' : 'text-gray-600 flex-shrink-0 mt-0.5'}>{icon}</span>
      <span className={green ? 'text-gray-300' : 'text-gray-500'}>{text}</span>
    </div>
  )
}

export function LanguageModeSelector() {
  const { cv, updateCVMode } = useCVStore()
  const mode = cv.cvMode || 'ar'
  const [pendingMode, setPendingMode] = useState<CVMode | null>(null)

  const handleClick = (newMode: CVMode) => {
    if (newMode === mode) return
    setPendingMode(newMode)
  }

  const handleConfirm = () => {
    if (pendingMode) updateCVMode(pendingMode)
    setPendingMode(null)
  }

  return (
    <>
      {pendingMode && (
        <ConfirmModal
          from={mode}
          to={pendingMode}
          onConfirm={handleConfirm}
          onCancel={() => setPendingMode(null)}
        />
      )}

      <div className="space-y-1">
        <p className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-2.5">لغة السيرة</p>

        {MODES.map((m) => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              onClick={() => handleClick(m.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-right group relative ${
                active ? m.activeClass + ' border-opacity-100' : 'border-white/8 hover:border-white/20 hover:bg-white/3'
              }`}
            >
              <span className="text-base flex-shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold leading-tight ${active ? m.textActive : 'text-gray-400 group-hover:text-gray-300'}`}>
                  {m.label}
                  {m.badge && active && (
                    <span className="mr-1.5 text-xs font-semibold text-yellow-500/70">★</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{m.sub}</div>
              </div>
              {active && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dotClass}`} />}
              {!active && <div className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0 group-hover:border-white/30 transition-colors" />}
            </button>
          )
        })}

        {/* Contextual tip based on current mode */}
        <div className="mt-3 pt-3 border-t border-white/6">
          {mode === 'bilingual' && (
            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-2.5">
              <p className="text-xs text-yellow-500/70 font-semibold mb-1">🌐 الوضع الثنائي نشط</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                استخدم زر <span className="text-blue-400 font-semibold">✦ → EN</span> في كل حقل للترجمة الفورية
              </p>
            </div>
          )}
          {mode === 'en' && (
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2.5">
              <p className="text-xs text-blue-400 font-semibold mb-1">🇬🇧 English mode</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Arabic data is saved. Switch back anytime without losing anything.
              </p>
            </div>
          )}
          {mode === 'ar' && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2.5">
              <p className="text-xs text-emerald-400/80 font-semibold mb-1">نصيحة</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                هل تتقدم لشركات دولية؟ جرّب <span className="text-yellow-500 font-semibold">الوضع الثنائي</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
