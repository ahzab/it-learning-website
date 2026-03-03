'use client'
// components/layout/FeaturesSection.tsx
import { useT } from '@/lib/i18n/context'

const COLORS = [
  { color:'#C9A84C', bg:'rgba(201,168,76,0.08)',  border:'rgba(201,168,76,0.15)'  },
  { color:'#22C55E', bg:'rgba(34,197,94,0.08)',   border:'rgba(34,197,94,0.15)'   },
  { color:'#06B6D4', bg:'rgba(6,182,212,0.08)',   border:'rgba(6,182,212,0.15)'   },
  { color:'#A78BFA', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.15)' },
  { color:'#F59E0B', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.15)'  },
  { color:'#EF4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.15)'   },
]

export function FeaturesSection() {
  const { t } = useT()
  const f = t.features

  return (
    <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden" style={{background:'#0A0A10'}}>
      <div className="absolute inset-0 arabesque-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] mb-5" style={{color:'#C9A84C'}}>{f.sectionLabel}</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F0EBE0] leading-tight mb-4">
            {f.headline1}{' '}
            <span style={{background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
              {f.headline2}
            </span>
          </h2>
          <p className="text-[#6B6672] text-base max-w-xl mx-auto leading-relaxed">{f.subtext}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {f.list.map((feature, i) => {
            const col = COLORS[i]
            return (
              <div key={i}
                className="group relative rounded-2xl p-5 sm:p-6 border transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
                style={{background:`linear-gradient(135deg, ${col.bg} 0%, rgba(255,255,255,0.012) 100%)`, borderColor: col.border}}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{background:`radial-gradient(circle at 50% 0%, ${col.bg} 0%, transparent 70%)`}} />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 border"
                    style={{background: col.bg, borderColor: col.border}}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-black text-[#F0EBE0] mb-2">{feature.title}</h3>
                  <p className="text-[#6B6672] text-sm leading-relaxed mb-4">{feature.desc}</p>
                  <div className="text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{color: col.color}}>
                    {f.discoverMore}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
