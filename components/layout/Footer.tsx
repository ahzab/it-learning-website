'use client'
// components/layout/Footer.tsx
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export function Footer() {
  const { t } = useT()
  const f = t.footer

  const goldGrad = { background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }

  return (
    <footer className="relative overflow-hidden" style={{background:'#060608'}}>
      <div className="h-px" style={{background:'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.2) 30%, rgba(201,168,76,0.3) 50%, rgba(201,168,76,0.2) 70%, transparent 100%)'}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-black"
                style={{background:'linear-gradient(135deg,#E8C97A,#A07830)'}}>
                س
              </div>
              <span className="text-lg font-black">
                <span style={goldGrad}>سيرتي</span>
                <span style={{color:'rgba(255,255,255,0.2)'}}>.ai</span>
              </span>
            </div>
            <p className="text-xs text-[#3A3742] leading-relaxed mb-6">{f.brand}</p>
            <div className="flex gap-2">
              {['𝕏','in','▶'].map(s => (
                <a key={s} href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all border"
                  style={{background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.06)', color:'#6B6672'}}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(201,168,76,0.3)'; (e.currentTarget as HTMLElement).style.color='#C9A84C' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color='#6B6672' }}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{color:'#C9A84C'}}>{f.colProduct}</div>
            <ul className="space-y-3">
              {f.productLinks.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-[#4A4550] hover:text-[#C9A84C] transition-colors duration-200">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Markets */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{color:'#C9A84C'}}>{f.colMarkets}</div>
            <ul className="space-y-3">
              {f.marketLinks.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-[#4A4550] hover:text-[#C9A84C] transition-colors duration-200">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + CTA */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{color:'#C9A84C'}}>{f.colCompany}</div>
            <ul className="space-y-3 mb-8">
              {f.companyLinks.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-[#4A4550] hover:text-[#C9A84C] transition-colors duration-200">{l.label}</Link>
                </li>
              ))}
            </ul>
            <Link href="/auth/register"
              className="block text-center py-3 rounded-xl text-sm font-black text-black transition-all hover:-translate-y-0.5"
              style={{background:'linear-gradient(135deg,#E8C97A,#C9A84C)', boxShadow:'0 0 20px rgba(201,168,76,0.2)'}}>
              {f.startFree}
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t"
          style={{borderColor:'rgba(255,255,255,0.04)'}}>
          <p className="text-[11px] text-[#2A2730]">{f.copyright}</p>
          <div className="flex items-center gap-1 text-[11px] text-[#2A2730]">{f.madeWith}</div>
        </div>
      </div>
    </footer>
  )
}
