'use client'
// app/auth/register/page.tsx
import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { registerSchema } from '@/lib/validation/schemas'
import { useValidation } from '@/lib/validation/useValidation'

export default function RegisterPage() {
  const { t, isRTL } = useT()
  const a = t.auth
  const v = useValidation(registerSchema)

  const [form,     setForm]     = useState({ name: '', email: '', password: '' })
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [pwVisible,setPwVisible]= useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!v.validate(form)) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        // Map server field errors into hook so they show inline
        if (data.fields) v.setServerErrors(data.fields)
        else setApiError(data.error || a.genericError)
        setLoading(false)
        return
      }
      await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      v.reset()
      router.push('/builder')
    } catch {
      setApiError(a.connectionError)
      setLoading(false)
    }
  }

  const goldGrad = { background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }

  const inputCls = 'w-full rounded-xl px-4 py-3 text-sm text-[#F0EBE0] outline-none transition-all'
  const inputSt  = (err?: string) => ({
    background: err ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)',
    border:     `1px solid ${err ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.08)'}`,
  })
  const onFocusBorder = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!v.errors[e.target.name]) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
  }
  const onBlurBorder = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!v.errors[e.target.name]) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
  }
  const labelCls = `block text-xs font-bold mb-2 text-[#6B6672] ${isRTL ? '' : 'uppercase tracking-wider'}`
  const errEl    = (id: string, msg?: string) => msg ? (
    <p id={id} className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5" role="alert">
      <span aria-hidden>⚠</span>{msg}
    </p>
  ) : <span id={id} />

  // Password strength
  const pw = form.password
  const pwStrength = pw.length === 0 ? 0
    : pw.length < 8 ? 1
    : (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) ? 4
    : (pw.length >= 10 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) ? 3
    : 2
  const pwColors = ['', '#EF4444', '#F59E0B', '#22C55E', '#22C55E']
  const pwLabels = a.passwordStrengths

  const nameErr     = v.fieldError('name')
  const emailErr    = v.fieldError('email')
  const passwordErr = v.fieldError('password')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background:'#060608' }}>
      <div className="absolute inset-0 arabesque-bg opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%)', transform:'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(34,197,94,0.04) 0%,transparent 70%)', transform:'translate(-30%,30%)' }} />

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
          <h1 className="text-2xl font-black text-[#F0EBE0]">{a.registerTitle}</h1>
          <p className="text-sm text-[#6B6672] mt-2">{a.registerSubtext}</p>
        </div>

        <div className="rounded-2xl p-5 sm:p-8 border" style={{ background:'rgba(255,255,255,0.02)', borderColor:'rgba(255,255,255,0.07)' }}>
          {apiError && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-400 mb-6 border flex items-center gap-2"
              style={{ background:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.2)' }} role="alert">
              <span>⚠</span> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full name */}
            <div>
              <label className={labelCls} htmlFor="reg-name">{a.fieldName}</label>
              <input
                id="reg-name" name="name" type="text"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                onBlur={e => { v.touch('name'); onBlurBorder(e) }}
                onFocus={onFocusBorder}
                placeholder={a.namePlaceholder}
                className={inputCls} style={inputSt(nameErr)}
                autoComplete="name" aria-describedby="reg-name-err" aria-invalid={!!nameErr}
              />
              {errEl('reg-name-err', nameErr)}
            </div>

            {/* Email — always dir=ltr */}
            <div>
              <label className={labelCls} htmlFor="reg-email">{a.fieldEmail}</label>
              <input
                id="reg-email" name="email" type="email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                onBlur={e => { v.touch('email'); onBlurBorder(e) }}
                onFocus={onFocusBorder}
                placeholder={a.emailPlaceholder} dir="ltr"
                className={inputCls} style={inputSt(emailErr)}
                autoComplete="email" aria-describedby="reg-email-err" aria-invalid={!!emailErr}
              />
              {errEl('reg-email-err', emailErr)}
            </div>

            {/* Password — always dir=ltr */}
            <div>
              <label className={labelCls} htmlFor="reg-pw">{a.fieldPassword}</label>
              <div className="relative">
                <input
                  id="reg-pw" name="password"
                  type={pwVisible ? 'text' : 'password'}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  onBlur={e => { v.touch('password'); onBlurBorder(e) }}
                  onFocus={onFocusBorder}
                  placeholder={a.passwordPlaceholder} dir="ltr"
                  className={`${inputCls} pr-12`} style={inputSt(passwordErr)}
                  autoComplete="new-password" minLength={8}
                  aria-describedby="reg-pw-err reg-pw-hint" aria-invalid={!!passwordErr}
                />
                <button type="button" onClick={() => setPwVisible(v => !v)}
                  className="absolute top-1/2 -translate-y-1/2 text-xs text-[#4A4550] hover:text-[#9994A0] transition-colors"
                  style={{ [isRTL ? 'left' : 'right']: '14px' }}
                  aria-label={pwVisible ? 'Hide password' : 'Show password'}>
                  {pwVisible ? '🙈' : '👁'}
                </button>
              </div>

              {/* Strength bar */}
              {pw.length > 0 && (
                <div className="mt-2 space-y-1" aria-live="polite">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= pwStrength ? pwColors[pwStrength] : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: pwColors[pwStrength] || '#4A4550' }}>
                    {pwLabels[pwStrength]}
                  </p>
                </div>
              )}

              {errEl('reg-pw-err', passwordErr)}
              {!passwordErr && (
                <p id="reg-pw-hint" className="text-[10px] text-[#3A3742] mt-1">{a.fieldPasswordHint}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-black text-black transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#E8C97A,#C9A84C)', boxShadow:'0 0 25px rgba(201,168,76,0.25)' }}>
              {loading ? a.registerLoading : a.registerCta}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-[#4A4550]">
            {a.registerHaveAcct}{' '}
            <Link href="/auth/login" className="font-bold transition-colors" style={{ color:'#C9A84C' }}>
              {a.registerSignIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
