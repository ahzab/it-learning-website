'use client'
import { useState } from 'react'
import { useCVStore } from '@/lib/store'
import { useT }       from '@/lib/i18n/context'
import { CVMode } from '@/types/cv'

export function LanguageModeSelector() {
  const { cv, updateCVMode } = useCVStore()
  const { t } = useT()
  const b = t.builder
  const mode = cv.cvMode || 'ar'
  const [pendingMode, setPendingMode] = useState<CVMode | null>(null)

  const MODES = [
    {
      id: 'ar' as CVMode, icon: '🇸🇦',
      label: b.modesArLabel, sub: 'Arabic only', desc: b.modesArDesc,
      activeClass: 'border-emerald-500/50 bg-emerald-500/8', dotClass: 'bg-emerald-400', textActive: 'text-emerald-300',
    },
    {
      id: 'en' as CVMode, icon: '🇬🇧',
      label: b.modesEnLabel, sub: 'English only', desc: b.modesEnDesc,
      activeClass: 'border-blue-500/50 bg-blue-500/8', dotClass: 'bg-blue-400', textActive: 'text-blue-300',
    },
    {
      id: 'bilingual' as CVMode, icon: '🌐',
      label: b.modesBiLabel, sub: 'عربي + English', desc: b.modesBiDesc,
      activeClass: 'border-yellow-500/50 bg-yellow-500/8', dotClass: 'bg-yellow-400', textActive: 'text-yellow-300',
      badge: b.modesBiBadge,
    },
  ]

  const handleConfirm = () => {
    if (pendingMode) updateCVMode(pendingMode)
    setPendingMode(null)
  }

  return (
    <>
      {pendingMode && (
        <ConfirmModal
          to={pendingMode}
          onConfirm={handleConfirm}
          onCancel={() => setPendingMode(null)}
          b={b}
          MODES={MODES}
        />
      )}

      <div className="space-y-1">
        <p className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-2.5">{b.cvLanguage}</p>

        {MODES.map((m) => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              onClick={() => m.id !== mode && setPendingMode(m.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-start group relative ${
                active ? m.activeClass + ' border-opacity-100' : 'border-white/8 hover:border-white/20 hover:bg-white/3'
              }`}
            >
              <span className="text-base flex-shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold leading-tight ${active ? m.textActive : 'text-gray-400 group-hover:text-gray-300'}`}>
                  {m.label}
                  {m.badge && active && <span className="ms-1.5 text-xs font-semibold text-yellow-500/70">★</span>}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{m.sub}</div>
              </div>
              {active  && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dotClass}`} />}
              {!active && <div className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0 group-hover:border-white/30 transition-colors" />}
            </button>
          )
        })}

        {/* Contextual tip */}
        <div className="mt-3 pt-3 border-t border-white/6">
          {mode === 'bilingual' && (
            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-2.5">
              <p className="text-xs text-yellow-500/70 font-semibold mb-1">{b.bilingualActive}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{b.bilingualTip}</p>
            </div>
          )}
          {mode === 'en' && (
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2.5">
              <p className="text-xs text-blue-400 font-semibold mb-1">🇬🇧 English mode</p>
              <p className="text-xs text-gray-600 leading-relaxed">{b.enModeTip}</p>
            </div>
          )}
          {mode === 'ar' && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2.5">
              <p className="text-xs text-emerald-400/80 font-semibold mb-1">{b.arModeNote}</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {b.arModeTip} <span className="text-yellow-500 font-semibold">{b.tryBilingual}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ConfirmModal({ to, onConfirm, onCancel, b, MODES }: {
  to: CVMode; onConfirm: ()=>void; onCancel: ()=>void; b: any; MODES: any[]
}) {
  const toMode = MODES.find(m => m.id === to)!
  const isBi   = to === 'bilingual'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-4xl text-center mb-3">{toMode.icon}</div>
        <h3 className="text-lg font-black text-center mb-1">
          {isBi ? b.activateBi : toMode.label}
        </h3>
        <p className="text-sm text-gray-400 text-center mb-5">{toMode.desc}</p>

        <div className="space-y-2 mb-5">
          {isBi ? (
            <>
              <Row icon="✓" text={b.biInfo1} green />
              <Row icon="✓" text={b.biInfo2} green />
              <Row icon="✓" text={b.biInfo3} green />
              <Row icon="✓" text={b.biInfo4} green />
              <Row icon="•" text={b.biNote} />
            </>
          ) : to === 'en' ? (
            <>
              <Row icon="✓" text={b.enInfo1} green />
              <Row icon="✓" text={b.enInfo2} green />
              <Row icon="•" text={b.enNote} />
            </>
          ) : (
            <>
              <Row icon="✓" text={b.arInfo1} green />
              <Row icon="✓" text={b.arInfo2} green />
              <Row icon="•" text={b.arNote} />
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:border-white/20 transition-colors">
            {b.cancel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              isBi    ? 'bg-yellow-500 hover:bg-yellow-400 text-black' :
              to==='en'? 'bg-blue-600 hover:bg-blue-500 text-white' :
              'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}>
            {isBi ? b.activateBi : b.apply}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, text, green }: { icon: string; text: string; green?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={green ? 'text-emerald-400 flex-shrink-0 mt-0.5' : 'text-gray-600 flex-shrink-0 mt-0.5'}>{icon}</span>
      <span className={green ? 'text-gray-300' : 'text-gray-500'}>{text}</span>
    </div>
  )
}
