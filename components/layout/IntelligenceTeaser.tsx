'use client'
// components/layout/IntelligenceTeaser.tsx
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

const salaryData = [
  { flag:'🇦🇪', country:'UAE',   range:'18-28K', currency:'AED', demand:'#22C55E' },
  { flag:'🇸🇦', country:'KSA',   range:'15-24K', currency:'SAR', demand:'#C9A84C' },
  { flag:'🇲🇦', country:'Maroc', range:'25-42K', currency:'MAD', demand:'#06B6D4' },
  { flag:'🇶🇦', country:'Qatar', range:'16-26K', currency:'QAR', demand:'#22C55E' },
]
const skillGaps = [
  { skill:'Docker',  pct:78, color:'#EF4444' },
  { skill:'AWS',     pct:65, color:'#F59E0B' },
  { skill:'GraphQL', pct:41, color:'#6B6672' },
]

export function IntelligenceTeaser() {
  const { t, isRTL } = useT()
  const d = t.intelligence

  const greenText = {
    background: 'linear-gradient(135deg,#4ADE80,#22C55E)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }
  const goldText = {
    background: 'linear-gradient(135deg,#E8C97A,#C9A84C)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }

  const features = [
    { icon:'💰', title: d.feature1Title, desc: d.feature1Desc, color:'#C9A84C' },
    { icon:'⚡', title: d.feature2Title, desc: d.feature2Desc, color:'#22C55E' },
    { icon:'📈', title: d.feature3Title, desc: d.feature3Desc, color:'#06B6D4' },
  ]

  return (
    <section id="intelligence-teaser" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden" style={{ background:'#060608' }}>
      <div className="absolute inset-0 arabesque-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse at 80% 50%, rgba(34,197,94,0.04) 0%, transparent 60%)' }} />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* Text — left in LTR, right in RTL */}
        <div className={isRTL ? 'lg:order-2' : 'lg:order-1'}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-5 sm:mb-8"
            style={{ background:'rgba(34,197,94,0.06)', borderColor:'rgba(34,197,94,0.2)', color:'#22C55E' }}>
            {d.badge}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.05] mb-5 sm:mb-6 text-[#F0EBE0]">
            {d.headline1}
            <br />
            <span style={greenText}>{d.headline2}</span>
          </h2>
          <p className="text-[#6B6672] text-sm sm:text-base leading-relaxed mb-7 sm:mb-10">{d.subtext}</p>

          <div className="space-y-4 mb-7 sm:mb-10">
            {features.map(f => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 border"
                  style={{ background:`${f.color}10`, borderColor:`${f.color}25` }}>
                  {f.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#F0EBE0]">{f.title}</div>
                  <div className="text-xs text-[#6B6672] mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/intelligence"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black text-black transition-all duration-300 hover:-translate-y-1"
            style={{ background:'linear-gradient(135deg,#4ADE80,#22C55E)', boxShadow:'0 0 30px rgba(34,197,94,0.3)' }}>
            {d.cta}
          </Link>
        </div>

        {/* Dashboard mockup — right in LTR, left in RTL */}
        <div className={isRTL ? 'lg:order-1' : 'lg:order-2'}>
          <div className="rounded-2xl border p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
            style={{ background:'linear-gradient(135deg,#0D0D14,#111119)', borderColor:'rgba(201,168,76,0.15)' }}>

            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm font-black text-[#F0EBE0]">{d.mockHeader}</div>
                <div className="text-xs text-[#6B6672]">Ahmed Ben Ali — {d.mockSubtitle}</div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold text-emerald-400"
                style={{ background:'rgba(34,197,94,0.08)', borderColor:'rgba(34,197,94,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {d.mockLive}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-4 border" style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="text-[10px] text-[#6B6672] mb-3">{d.mockHealth}</div>
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#22C55E" strokeWidth="3"
                      strokeDasharray={`${0.78 * 2 * Math.PI * 16} ${2 * Math.PI * 16}`} strokeLinecap="round" />
                  </svg>
                  <div>
                    <div className="text-lg font-black" style={greenText}>B+</div>
                    <div className="text-[10px] text-[#6B6672]">{d.mockScore}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 border" style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="text-[10px] text-[#6B6672] mb-3">{d.mockScoreDesc}</div>
                {[
                  { label: d.mockMetric1, pct: 87, color:'#22C55E' },
                  { label: d.mockMetric2, pct: 92, color:'#C9A84C' },
                  { label: d.mockMetric3, pct: 74, color:'#06B6D4' },
                ].map(m => (
                  <div key={m.label} className="mb-1.5">
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="text-[#4A4550]">{m.label}</span>
                      <span style={{ color: m.color }}>{m.pct}%</span>
                    </div>
                    <div className="h-0.5 rounded-full bg-white/6">
                      <div className="h-full rounded-full" style={{ width:`${m.pct}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-[10px] text-[#6B6672] font-bold uppercase tracking-wider mb-3">{d.mockSalaryTitle}</div>
              <div className="space-y-2">
                {salaryData.map(c => (
                  <div key={c.country} className="flex items-center gap-2 text-xs">
                    <span>{c.flag}</span>
                    <span className="text-[#4A4550] w-12">{c.country}</span>
                    <span className="text-[#F0EBE0] font-mono font-bold flex-1">{c.range}</span>
                    <span className="text-[#3A3742] font-mono text-[10px]">{c.currency}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.demand }} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[#6B6672] font-bold uppercase tracking-wider mb-3">{d.mockSkillsTitle}</div>
              <div className="flex gap-2 flex-wrap">
                {skillGaps.map(s => (
                  <div key={s.skill} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold"
                    style={{ background:`${s.color}10`, borderColor:`${s.color}25`, color: s.color }}>
                    {s.skill} <span className="opacity-60">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -inset-8 rounded-3xl pointer-events-none -z-10"
            style={{ background:'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />
        </div>
      </div>
    </section>
  )
}
