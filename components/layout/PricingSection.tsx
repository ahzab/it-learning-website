'use client'
// components/layout/PricingSection.tsx
import Link from 'next/link'
import { useState } from 'react'
import { useT } from '@/lib/i18n/context'

export function PricingSection() {
  const { t } = useT()
  const p = t.pricing
  const [hovered, setHovered] = useState<string | null>(null)

  const goldText = { background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }

  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden" style={{background:'#060608'}}>
      <div className="absolute inset-0 arabesque-bg opacity-20 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.15) 50%,transparent)'}} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{background:'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)'}} />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] mb-5" style={{color:'#C9A84C'}}>
            — {p.sectionLabel}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4 text-[#F0EBE0]">
            {p.headline1}
            <br />
            <span style={goldText}>{p.headline2}</span>
          </h2>
          <p className="text-[#6B6672] text-base max-w-md mx-auto">{p.subtext}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 sm:mb-12">
          {p.plans.map(plan => {
            const isFeatured = plan.id === 'starter'
            const isHovered  = hovered === plan.id
            return (
              <div key={plan.id}
                className="relative rounded-2xl p-5 sm:p-6 border flex flex-col transition-all duration-300"
                style={{
                  background: isFeatured
                    ? 'linear-gradient(135deg,rgba(201,168,76,0.08) 0%,rgba(255,255,255,0.025) 100%)'
                    : isHovered ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
                  borderColor: isFeatured ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.07)',
                  transform: isFeatured ? 'none' : isHovered ? 'translateY(-4px)' : 'none',
                  boxShadow: isFeatured ? '0 0 60px rgba(201,168,76,0.12)' : 'none',
                }}
                onMouseEnter={() => !isFeatured && setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}>

                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black text-black whitespace-nowrap"
                    style={{background:'linear-gradient(135deg,#E8C97A,#C9A84C)'}}>
                    {plan.badge}
                  </div>
                )}
                {isFeatured && (
                  <div className="absolute top-0 inset-x-6 h-px"
                    style={{background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)'}} />
                )}

                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{color: isFeatured ? '#C9A84C' : '#4A4550'}}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black" style={isFeatured ? goldText : {color:'#F0EBE0'}}>
                      {plan.currency}{plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-xs text-[#4A4550]">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6672]">{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      <span className={f.included ? 'text-emerald-400' : 'text-[#3A3742]'}>
                        {f.included ? '✓' : '×'}
                      </span>
                      <span className={f.included ? 'text-[#9994A0]' : 'text-[#3A3742] line-through'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.id === 'free' ? '/generate' : plan.id === 'starter' ? '/api/payment/checkout?plan=STARTER' : '/api/payment/checkout?plan=PRO'}
                  className="block w-full text-center py-3.5 rounded-xl text-sm font-black transition-all duration-300 active:scale-98 sm:hover:-translate-y-0.5"
                  style={isFeatured
                    ? {background:'linear-gradient(135deg,#E8C97A,#C9A84C)', color:'#000', boxShadow:'0 0 25px rgba(201,168,76,0.3)'}
                    : {background:'rgba(255,255,255,0.06)', color:'#9994A0', border:'1px solid rgba(255,255,255,0.1)'}}>
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-[#3A3742] font-semibold">
          {[p.trust1, p.trust2, p.trust3].map(tr => (
            <span key={tr}>{tr}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
