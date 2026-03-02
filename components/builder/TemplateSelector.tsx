// components/builder/TemplateSelector.tsx
'use client'
import { useCVStore } from '@/lib/store'
import { TEMPLATES } from '@/components/cv/templates'

export function TemplateSelector() {
  const template       = useCVStore((s) => s.cv.template)
  const cvMode         = useCVStore((s) => s.cv.cvMode)
  const updateTemplate = useCVStore((s) => s.updateTemplate)

  const isEn = cvMode === 'en'

  return (
    <div>
      <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">
        {isEn ? 'Template' : 'القالب'}
      </p>
      <div className="space-y-1">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => updateTemplate(t.id as any)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-all ${
              template === t.id
                ? 'border border-yellow-500/40 bg-yellow-500/10'
                : 'border border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div
              className="w-5 h-5 rounded flex-shrink-0 border border-white/10"
              style={{ background: t.preview }}
            />
            <div className="flex-1 text-right">
              <div className={`text-xs font-bold ${template === t.id ? 'text-yellow-400' : 'text-gray-400'}`}>
                {t.icon} {t.label}
              </div>
            </div>
            {template === t.id && <span className="text-yellow-500 text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
