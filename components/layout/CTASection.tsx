'use client'
// components/layout/CTASection.tsx
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export function CTASection() {
  const { t, isRTL } = useT()
  const c = t.cta

  const goldText = {
    background: 'linear-gradient(135deg,#E8C97A 0%,#C9A84C 50%,#8B6E2A 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }

  // Arrow points away from reading direction
  const arrow = isRTL ? '→' : '←'

  return (
    <section className="py-32 px-6 relative overflow-hidden" style={{ background:'#060608' }}>
      <div className="absolute inset-0 arabesque-bg opacity-25 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.08) 0%, transparent 60%)' }} />
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background:'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.4) 30%, rgba(232,201,122,0.6) 50%, rgba(201,168,76,0.4) 70%, transparent 100%)' }} />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 border mx-auto"
          style={{ background:'rgba(201,168,76,0.08)', borderColor:'rgba(201,168,76,0.2)', boxShadow:'0 0 30px rgba(201,168,76,0.1)' }}>
          <span className="text-2xl font-black" style={goldText}>س</span>
        </div>

        <h2 className="text-4xl lg:text-6xl font-black leading-[1.05] mb-6 text-[#F0EBE0]">
          {c.headline1}
          <br />
          <span style={goldText}>{c.headline2}</span>
        </h2>

        <p className="text-[#6B6672] text-lg mb-12 max-w-lg mx-auto leading-relaxed">{c.subtext}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
          <Link href="/generate"
            className="group flex items-center gap-3 px-8 py-4 rounded-xl font-black text-base text-black transition-all duration-300 hover:-translate-y-1"
            style={{ background:'linear-gradient(135deg,#E8C97A 0%,#C9A84C 60%,#A07830 100%)', boxShadow:'0 0 40px rgba(201,168,76,0.35)' }}>
            <span>✦</span>
            {c.ctaAI}
            <span className={`transition-transform ${isRTL ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}>{arrow}</span>
          </Link>
          <Link href="/builder"
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base border transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
            style={{ borderColor:'rgba(255,255,255,0.1)', color:'#9994A0', background:'rgba(255,255,255,0.02)' }}>
            {c.ctaManual}
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-[#3A3742]">
          {[c.trust1, c.trust2, c.trust3, c.trust4].map(item => (
            <span key={item} className="font-semibold">{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
