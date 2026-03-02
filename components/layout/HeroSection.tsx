'use client'
// components/layout/HeroSection.tsx
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export function HeroSection() {
  const { t, isRTL } = useT()
  const h = t.hero

  const goldText = {
    background: 'linear-gradient(135deg,#E8C97A 0%,#C9A84C 50%,#8B6E2A 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-[#060608]" />
      <div className="absolute inset-0 arabesque-bg opacity-100 pointer-events-none" />

      {/* Rotating geometric */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none opacity-[0.035] animate-spin-slow">
        <svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M400 50L750 200L750 600L400 750L50 600L50 200Z" stroke="#C9A84C" strokeWidth="1.5"/>
          <path d="M400 100L700 230L700 570L400 700L100 570L100 230Z" stroke="#C9A84C" strokeWidth="1"/>
          <path d="M400 150L650 260L650 540L400 650L150 540L150 260Z" stroke="#C9A84C" strokeWidth="0.8"/>
          <circle cx="400" cy="400" r="300" stroke="#C9A84C" strokeWidth="0.8"/>
          <circle cx="400" cy="400" r="250" stroke="#C9A84C" strokeWidth="0.5"/>
          <circle cx="400" cy="400" r="180" stroke="#C9A84C" strokeWidth="0.8"/>
          <path d="M400 100L700 570L100 570Z" stroke="#C9A84C" strokeWidth="0.5" opacity="0.6"/>
          <path d="M400 700L700 230L100 230Z" stroke="#C9A84C" strokeWidth="0.5" opacity="0.6"/>
          <path d="M50 400L750 400" stroke="#C9A84C" strokeWidth="0.4"/>
          <path d="M400 50L400 750" stroke="#C9A84C" strokeWidth="0.4"/>
          <path d="M150 150L650 650" stroke="#C9A84C" strokeWidth="0.3" opacity="0.5"/>
          <path d="M650 150L150 650" stroke="#C9A84C" strokeWidth="0.3" opacity="0.5"/>
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => (
            <line key={deg} x1="400" y1="400"
              x2={400 + 300 * Math.cos(deg * Math.PI / 180)}
              y2={400 + 300 * Math.sin(deg * Math.PI / 180)}
              stroke="#C9A84C" strokeWidth="0.3" opacity="0.3"/>
          ))}
        </svg>
      </div>

      {/* Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)', transform:'translate(20%, -20%)' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle, rgba(56,82,190,0.06) 0%, transparent 70%)', transform:'translate(-30%, 30%)' }} />

      <div className="relative max-w-7xl mx-auto w-full px-6 py-20 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-center">

        {/* Text column — in RTL: order-2/lg:order-1 (text appears on right side of grid which is visual left in RTL) */}
        {/* In LTR: order-1 (text on left) */}
        <div className={`lg:col-span-3 ${isRTL ? 'order-2 lg:order-1' : 'order-1 lg:order-1'}`}>
          <div className="reveal-1 inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold mb-8 border"
            style={{ background:'rgba(201,168,76,0.06)', borderColor:'rgba(201,168,76,0.2)', color:'#C9A84C' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            {h.badge}
          </div>

          <div className="reveal-2">
            <h1 className="font-black leading-[1.05] mb-6">
              <span className="block text-5xl lg:text-6xl xl:text-7xl text-[#F0EBE0] tracking-tight">{h.headline1}</span>
              <span className="block text-5xl lg:text-6xl xl:text-7xl tracking-tight" style={goldText}>{h.headline2}</span>
              <span className="block text-3xl lg:text-4xl text-[#3A3742] font-bold mt-2 tracking-tight">{h.headline3}</span>
            </h1>
          </div>

          <p className="reveal-3 text-base lg:text-lg text-[#6B6672] leading-relaxed mb-10 max-w-xl">{h.subtext}</p>

          <div className="reveal-4 flex flex-col sm:flex-row gap-3 mb-12">
            <Link href="/generate"
              className="group flex items-center justify-center gap-3 px-7 py-4 rounded-xl font-black text-base text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(201,168,76,0.5)]"
              style={{ background:'linear-gradient(135deg,#E8C97A 0%,#C9A84C 60%,#A07830 100%)', boxShadow:'0 0 30px rgba(201,168,76,0.3)' }}>
              <span className="animate-pulse">✦</span>
              {h.ctaAI}
            </Link>
            <Link href="/builder"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-base border transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
              style={{ borderColor:'rgba(255,255,255,0.1)', color:'#9994A0', background:'rgba(255,255,255,0.02)' }}>
              {h.ctaManual}
            </Link>
          </div>

          <div className="reveal-5 flex items-center gap-8">
            {[
              { num: h.stat1Num, label: h.stat1Label },
              { num: h.stat2Num, label: h.stat2Label },
              { num: h.stat3Num, label: h.stat3Label },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-black font-mono-data" style={goldText}>{s.num}</div>
                <div className="text-xs text-[#3A3742] font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mockup column — flips to opposite side */}
        <div className={`lg:col-span-2 flex justify-center ${isRTL ? 'order-1 lg:order-2 lg:justify-start' : 'order-2 lg:order-2 lg:justify-end'}`}>
          <div className="relative w-full max-w-xs lg:max-w-none">
            <div className="relative rounded-2xl border p-5 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-float"
              style={{ background:'linear-gradient(135deg,#0D0D14 0%,#111119 100%)', borderColor:'rgba(255,255,255,0.08)' }}>

              {/* Card header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black text-black flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#E8C97A,#C9A84C)' }}>أ</div>
                <div>
                  <div className="text-sm font-black text-[#F0EBE0]">{h.mockName}</div>
                  <div className="text-xs text-[#6B6672]">{h.mockTitle}</div>
                </div>
                {/* Location pushed to inline-end (right in LTR, left in RTL) */}
                <div className="text-[10px] font-mono text-[#3A3742]" style={{ marginInlineStart:'auto' }}>{h.mockLocation}</div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-[#4A4550] mb-1.5">
                  <span>{h.mockAnalyze}</span><span style={{ color:'#C9A84C' }}>87%</span>
                </div>
                <div className="h-1 rounded-full bg-white/6">
                  <div className="h-full w-[87%] rounded-full" style={{ background:'linear-gradient(90deg,#C9A84C,#E8C97A)' }} />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2.5 mb-4">
                {[['React Native','92'],['Node.js','86'],['TypeScript','78']].map(([sk, pct]) => (
                  <div key={sk}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[#9994A0] font-mono">{sk}</span>
                      <span style={{ color:'#C9A84C' }}>{pct}%</span>
                    </div>
                    <div className="h-px bg-white/6 rounded-full">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:'linear-gradient(90deg,rgba(201,168,76,0.4),rgba(201,168,76,0.8))' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Match badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background:'rgba(34,197,94,0.06)', borderColor:'rgba(34,197,94,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400">{h.mockMatch}</span>
              </div>
            </div>

            {/* Floating pill — top corner in inline-end direction */}
            <div
              className="absolute -top-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold text-emerald-400 shadow-xl"
              style={{
                [isRTL ? 'left' : 'right']: '-1rem',
                background: 'rgba(10,15,25,0.95)',
                borderColor: 'rgba(34,197,94,0.25)',
                backdropFilter: 'blur(12px)',
              }}>
              {h.mockAccepted}
              <span className="text-[#4A4550] font-normal">{h.mockCompany}</span>
            </div>

            {/* Floating pill — bottom corner in inline-start direction */}
            <div
              className="absolute -bottom-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] shadow-xl"
              style={{
                [isRTL ? 'right' : 'left']: '-1rem',
                background: 'rgba(10,15,25,0.95)',
                borderColor: 'rgba(201,168,76,0.25)',
                backdropFilter: 'blur(12px)',
              }}>
              <span className="text-[#4A4550]">{h.mockSalary}</span>
              <span className="font-black" style={{ color:'#C9A84C' }}>AED 18,500</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
