'use client'
// components/layout/TestimonialsSection.tsx
import { useT } from '@/lib/i18n/context'

export function TestimonialsSection() {
  const { t } = useT()
  const s = t.testimonials

  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{background:'#0A0A10'}}>
      <div className="absolute inset-0 arabesque-bg opacity-15 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] mb-5" style={{color:'#C9A84C'}}>
            <span className="w-8 h-px" style={{background:'linear-gradient(90deg,transparent,#C9A84C)'}} />
            {s.sectionLabel}
            <span className="w-8 h-px" style={{background:'linear-gradient(90deg,#C9A84C,transparent)'}} />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-[#F0EBE0] leading-tight">
            {s.headline1}
            <br />
            <span style={{background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
              {s.headline2}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {s.list.map((item, i) => (
            <div key={item.name}
              className="relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 group"
              style={{
                background: i === 0 ? 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(255,255,255,0.015) 100%)' : 'rgba(255,255,255,0.018)',
                borderColor: i === 0 ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)',
              }}>
              <div className="text-6xl leading-none font-black mb-4 select-none"
                style={{color: i === 0 ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)', fontFamily:'Georgia,serif'}}>
                "
              </div>
              <p className="text-[#9994A0] text-sm leading-relaxed mb-6 -mt-4">{item.quote}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black mb-5 border"
                style={{background:`${item.resultColor}10`, borderColor:`${item.resultColor}25`, color:item.resultColor}}>
                ✦ {item.result}
              </div>
              <div className="flex items-center gap-3 pt-5 border-t" style={{borderColor:'rgba(255,255,255,0.05)'}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-black flex-shrink-0"
                  style={{background:item.avatarBg}}>
                  {item.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#F0EBE0]">{item.name}</div>
                  <div className="text-[11px] text-[#6B6672] truncate">{item.role} · {item.company}</div>
                </div>
                <div className="text-[11px] text-[#3A3742] flex-shrink-0">{item.country}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 mt-12">
          <div className="flex gap-1">
            {[...Array(5)].map((_,i) => (
              <svg key={i} viewBox="0 0 16 16" className="w-5 h-5 fill-current" style={{color:'#C9A84C'}}>
                <path d="M8 1l1.854 3.756L14 5.525l-3 2.924.708 4.126L8 10.4l-3.708 2.175L5 8.449 2 5.525l4.146-.769L8 1z"/>
              </svg>
            ))}
          </div>
          <div className="text-sm text-[#6B6672]">
            <span className="font-black text-[#F0EBE0]">{s.rating}</span> {s.ratingDesc}
          </div>
        </div>
      </div>
    </section>
  )
}
