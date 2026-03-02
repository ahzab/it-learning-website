'use client'
// app/auth/login/page.tsx
import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { loginSchema, emailField } from '@/lib/validation/schemas'
import { useValidation } from '@/lib/validation/useValidation'
import { z } from 'zod'

export default function LoginPage() {
  const { t, isRTL } = useT()
  const a = t.auth
  const v = useValidation(loginSchema)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!v.validate({ email, password })) return

    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setApiError(a.loginError)
    } else {
      v.reset()
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const goldGrad = { background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }

  const inputCls = 'w-full rounded-xl px-4 py-3 text-sm text-[#F0EBE0] outline-none transition-all'
  const inputSt  = (err?: string) => ({
    background: err ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)',
    border:     `1px solid ${err ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.08)'}`,
    transition: 'border-color 0.15s',
  })
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!v.errors[e.target.name]) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
  }
  const onBlurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!v.errors[e.target.name]) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
  }
  const labelCls = `block text-xs font-bold mb-2 text-[#6B6672] ${isRTL ? '' : 'uppercase tracking-wider'}`
  const errEl    = (msg?: string) => msg ? (
    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5"><span aria-hidden>⚠</span>{msg}</p>
  ) : null

  const emailErr    = v.fieldError('email')
  const passwordErr = v.fieldError('password')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background:'#060608' }}>
      <div className="absolute inset-0 arabesque-bg opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%)', transform:'translate(30%,-30%)' }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-black"
              style={{ background:'linear-gradient(135deg,#E8C97A,#A07830)', boxShadow:'0 0 20px rgba(201,168,76,0.4)' }}>
              س
            </div>
            <span className="text-2xl font-black" dir="ltr">
              <span style={goldGrad}>سيرتي</span>
              <span style={{ color:'rgba(255,255,255,0.25)' }}>.ai</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-[#F0EBE0]">{a.loginTitle}</h1>
          <p className="text-sm text-[#6B6672] mt-2">{a.loginSubtext}</p>
        </div>

        <div className="rounded-2xl p-5 sm:p-8 border" style={{ background:'rgba(255,255,255,0.02)', borderColor:'rgba(255,255,255,0.07)' }}>
          {apiError && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-400 mb-6 border flex items-center gap-2"
              style={{ background:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.2)' }}>
              <span>⚠</span> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className={labelCls} htmlFor="login-email">{a.fieldEmail}</label>
              <input
                id="login-email" name="email" type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                onBlur={e => { v.touch('email'); onBlurStyle(e) }}
                onFocus={onFocus}
                placeholder={a.emailPlaceholder} dir="ltr"
                className={inputCls} style={inputSt(emailErr)}
                autoComplete="email" aria-describedby={emailErr ? 'login-email-err' : undefined}
                aria-invalid={!!emailErr}
              />
              <div id="login-email-err">{errEl(emailErr)}</div>
            </div>

            <div>
              <label className={labelCls} htmlFor="login-pw">{a.fieldPassword}</label>
              <input
                id="login-pw" name="password" type="password"
                value={password} onChange={e => setPassword(e.target.value)}
                onBlur={e => { v.touch('password'); onBlurStyle(e) }}
                onFocus={onFocus}
                placeholder={a.passwordPlaceholder} dir="ltr"
                className={inputCls} style={inputSt(passwordErr)}
                autoComplete="current-password" aria-describedby={passwordErr ? 'login-pw-err' : undefined}
                aria-invalid={!!passwordErr}
              />
              <div id="login-pw-err">{errEl(passwordErr)}</div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-black text-black transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#E8C97A,#C9A84C)', boxShadow:'0 0 25px rgba(201,168,76,0.25)' }}>
              {loading ? a.loginLoading : a.loginCta}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-[#4A4550]">
            {a.loginNoAccount}{' '}
            <Link href="/auth/register" className="font-bold transition-colors" style={{ color:'#C9A84C' }}>
              {a.loginCreateFree}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
