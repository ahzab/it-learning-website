'use client'
// components/layout/CountriesSection.tsx
import { useT } from '@/lib/i18n/context'

export function CountriesSection() {
  const { t } = useT()
  const c = t.countries
  const doubled = [...c.list, ...c.list]

  const goldText = { background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }

  return (
    <section id="templates" className="py-24 px-6 relative overflow-hidden" style={{background:'#060608'}}>
      <div className="max-w-7xl mx-auto text-center mb-14">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{color:'#C9A84C'}}>{c.sectionLabel}</div>
        <h2 className="text-3xl lg:text-4xl font-black text-[#F0EBE0] mb-3">{c.headline}</h2>
        <p className="text-[#6B6672] text-sm max-w-md mx-auto">{c.subtext}</p>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{background:'linear-gradient(to left, #060608, transparent)'}} />
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{background:'linear-gradient(to right, #060608, transparent)'}} />
        <div className="flex gap-4 animate-marquee w-max">
          {doubled.map((country, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-4 rounded-2xl border flex-shrink-0 hover:border-[#C9A84C]/30 transition-colors group cursor-default"
              style={{background:'rgba(255,255,255,0.025)', borderColor:'rgba(255,255,255,0.07)'}}>
              <span className="text-2xl">{country.flag}</span>
              <div>
                <div className="text-sm font-bold text-[#F0EBE0] group-hover:text-[#C9A84C] transition-colors">{country.name}</div>
                <div className="text-[10px] text-[#3A3742] font-mono">{country.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/6"
        style={{background:'rgba(255,255,255,0.06)'}}>
        {[
          { num: c.stat1Num, label: c.stat1Label },
          { num: c.stat2Num, label: c.stat2Label },
          { num: c.stat3Num, label: c.stat3Label },
          { num: c.stat4Num, label: c.stat4Label },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center justify-center py-8 px-4 text-center"
            style={{background:'rgba(13,13,18,0.95)'}}>
            <div className="text-2xl lg:text-3xl font-black font-mono-data mb-1" style={goldText}>{s.num}</div>
            <div className="text-xs text-[#4A4550] font-semibold">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
