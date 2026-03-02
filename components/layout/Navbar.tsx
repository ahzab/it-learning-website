'use client'
// components/layout/Navbar.tsx
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useT } from '@/lib/i18n/context'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Navbar() {
  const { data: session } = useSession()
  const { t, isRTL } = useT()
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const goldGrad = {
    background: 'linear-gradient(135deg,#E8C97A 0%,#C9A84C 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }

  const navLinks: [string, string][] = [
    ['#features',            t.nav.features],
    ['#pricing',             t.nav.pricing],
    ['#intelligence-teaser', t.nav.intelligence],
    ['#templates',           t.nav.templates],
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#060608]/92 backdrop-blur-2xl border-b border-white/6 shadow-[0_4px_40px_rgba(0,0,0,0.6)]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo — always LTR visually */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-black shadow-[0_0_16px_rgba(201,168,76,0.45)] group-hover:shadow-[0_0_28px_rgba(201,168,76,0.7)] transition-all duration-300"
            style={{ background: 'linear-gradient(135deg,#E8C97A,#A07830)' }}>
            س
          </div>
          <span className="text-xl font-black tracking-tight" dir="ltr">
            <span style={goldGrad}>سيرتي</span>
            <span className="text-white/30">.ai</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1 list-none">
          {navLinks.map(([href, label]) => (
            <li key={href}>
              <Link href={href}
                className="relative text-sm text-[#6B6672] hover:text-white transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-white/4 group block">
                {label}
                {/* Underline animates from the start of reading direction */}
                <span
                  className="absolute bottom-1.5 inset-x-4 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded"
                  style={{
                    background:    'linear-gradient(90deg,#C9A84C,#E8C97A)',
                    transformOrigin: isRTL ? 'right' : 'left',
                  }}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-[#9994A0] hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                {t.nav.dashboard}
              </Link>
              <button onClick={() => signOut()} className="text-sm text-[#4A4550] hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/8">
                {t.nav.signOut}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-[#9994A0] hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                {t.nav.signIn}
              </Link>
              <Link href="/auth/register"
                className="text-sm font-black text-black px-5 py-2 rounded-lg shadow-[0_0_20px_rgba(201,168,76,0.35)] hover:shadow-[0_0_32px_rgba(201,168,76,0.55)] transition-all duration-300 hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg,#E8C97A 0%,#C9A84C 50%,#A07830 100%)' }}>
                {t.nav.startFree}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label={t.nav.menuAriaLabel}>
          <span className={`w-5 h-px bg-white/70 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`w-5 h-px bg-white/70 transition-all duration-300 ${menuOpen ? 'opacity-0 w-0' : ''}`} />
          <span className={`w-5 h-px bg-white/70 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0A0A10]/98 backdrop-blur-2xl border-b border-white/8 px-6 py-5 space-y-1">
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className="block text-[#9994A0] hover:text-[#C9A84C] py-3 px-3 rounded-xl hover:bg-white/4 text-sm transition-colors border-b border-white/4 last:border-0">
              {label}
            </Link>
          ))}
          <div className="pt-3 pb-1">
            <LanguageSwitcher />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/auth/login" onClick={() => setMenuOpen(false)}
              className="flex-1 text-center border border-white/12 text-sm text-[#9994A0] py-3 rounded-xl hover:border-white/25 transition-colors">
              {t.nav.signIn}
            </Link>
            <Link href="/auth/register" onClick={() => setMenuOpen(false)}
              className="flex-1 text-center text-sm font-black text-black py-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#E8C97A,#C9A84C)' }}>
              {t.nav.startFree}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
