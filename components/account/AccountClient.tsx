'use client'
// components/account/AccountClient.tsx
// Account settings — profile, security, plan & billing, danger zone.
// Aesthetic: surgical precision. Dark slate base (#07090F), ice-white dividers,
// monospaced data labels, cold blue-green action accents. No fluff.

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n/context'
import { PLAN_DEFS, normalizePlan } from '@/lib/plans'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileData {
  id:           string
  name:         string | null
  email:        string | null
  plan:         string
  image:        string | null
  aiCreditsUsed: number
  createdAt:    string
  cvCount:      number
  payments:     { id: string; amount: number | null; currency: string | null; plan: string; createdAt: string }[]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#0C0F18] border border-white/6 rounded-2xl overflow-hidden">
      <div className="px-5 sm:px-7 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-sm font-black text-white tracking-wide uppercase">{title}</h2>
        {badge && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold">
            {badge}
          </span>
        )}
      </div>
      <div className="px-5 sm:px-7 py-5 sm:py-6 space-y-5">
        {children}
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-500 uppercase tracking-widest font-bold block">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, disabled, ...props }: {
  value: string; onChange?: (v: string) => void; type?: string
  placeholder?: string; disabled?: boolean; [key: string]: any
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-[#111520] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:border-teal-500/40 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
      {...props}
    />
  )
}

function SaveBtn({ loading, saved, onClick, label }: { loading: boolean; saved: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
        saved
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
          : loading
          ? 'bg-white/5 text-gray-500 border border-white/8 cursor-wait'
          : 'bg-teal-500/10 text-teal-400 border border-teal-500/25 hover:bg-teal-500/18'
      }`}
    >
      {saved ? '✓ Saved' : loading ? '…' : label}
    </button>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">⚠ {msg}</p>
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AccountClient() {
  const { data: session, update: updateSession } = useSession()
  const { t, isRTL } = useT()
  const router = useRouter()
  const isAr   = isRTL || false

  // Profile
  const [profile,      setProfile]      = useState<ProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Edit name
  const [name,         setName]         = useState('')
  const [nameLoading,  setNameLoading]  = useState(false)
  const [nameSaved,    setNameSaved]    = useState(false)
  const [nameError,    setNameError]    = useState('')

  // Change password
  const [curPwd,       setCurPwd]       = useState('')
  const [newPwd,       setNewPwd]       = useState('')
  const [confirmPwd,   setConfirmPwd]   = useState('')
  const [pwdLoading,   setPwdLoading]   = useState(false)
  const [pwdSaved,     setPwdSaved]     = useState(false)
  const [pwdError,     setPwdError]     = useState('')

  // Delete account
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [deletePwd,    setDeletePwd]    = useState('')
  const [deleteEmail,  setDeleteEmail]  = useState('')
  const [deleteLoading,setDeleteLoading] = useState(false)
  const [deleteError,  setDeleteError]  = useState('')

  // Copy share URL
  const [copiedUrl,    setCopiedUrl]    = useState(false)

  // ── Load profile ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/me/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d)
        setName(d.name || '')
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [])

  if (!session?.user?.id) {
    router.push('/auth/login')
    return null
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const saveName = async () => {
    if (!name.trim()) { setNameError(isAr ? 'الاسم مطلوب' : 'Name is required'); return }
    setNameLoading(true); setNameError('')
    const res = await fetch('/api/me/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    setNameLoading(false)
    if (res.ok) {
      setNameSaved(true)
      await updateSession({ name })
      setTimeout(() => setNameSaved(false), 2500)
    } else {
      const d = await res.json().catch(() => ({}))
      setNameError(d.error || (isAr ? 'فشل الحفظ' : 'Save failed'))
    }
  }

  const changePassword = async () => {
    setPwdError('')
    if (!curPwd)                 { setPwdError(isAr ? 'أدخل كلمة المرور الحالية' : 'Enter current password'); return }
    if (newPwd.length < 8)       { setPwdError(isAr ? 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل' : 'Password must be at least 8 characters'); return }
    if (newPwd !== confirmPwd)   { setPwdError(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return }
    setPwdLoading(true)
    const res = await fetch('/api/me/password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
    })
    setPwdLoading(false)
    if (res.ok) {
      setPwdSaved(true)
      setCurPwd(''); setNewPwd(''); setConfirmPwd('')
      setTimeout(() => setPwdSaved(false), 3000)
    } else {
      const d = await res.json().catch(() => ({}))
      setPwdError(d.error || (isAr ? 'فشل تغيير كلمة المرور' : 'Failed to change password'))
    }
  }

  const deleteAccount = async () => {
    setDeleteError('')
    setDeleteLoading(true)
    const res = await fetch('/api/me/delete', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: deletePwd || undefined, email: deleteEmail || undefined }),
    })
    setDeleteLoading(false)
    if (res.ok) {
      await signOut({ callbackUrl: '/' })
    } else {
      const d = await res.json().catch(() => ({}))
      setDeleteError(d.error || (isAr ? 'فشل حذف الحساب' : 'Failed to delete account'))
    }
  }

  const plan    = normalizePlan((profile?.plan || session.user.plan || 'FREE') as any)
  const planDef = PLAN_DEFS[plan]

  const planColor = plan === 'PRO' ? '#A78BFA' : plan === 'STARTER' ? '#C9A84C' : '#6B7280'
  const planIcon  = plan === 'PRO' ? '✦' : plan === 'STARTER' ? '◆' : '○'

  const isOAuthUser = !profileLoading && profile && !session.user.email?.includes('@')

  const dir = isRTL ? 'rtl' : 'ltr'

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07090F] text-white" dir={dir}>
      {/* Header */}
      <header className="border-b border-white/6 bg-[#07090F]/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-yellow-500 font-black text-xl">سيرتي.ai</a>
            <span className="text-gray-700">·</span>
            <span className="text-sm text-gray-400 font-bold">
              {isAr ? 'إعدادات الحساب' : 'Account Settings'}
            </span>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-gray-500 hover:text-gray-300 border border-white/8 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isAr ? '← لوحتي' : '← Dashboard'}
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">

        {/* ── Profile ────────────────────────────────────────────────── */}
        <Section title={isAr ? 'الملف الشخصي' : 'Profile'}>
          <Field label={isAr ? 'الاسم الكامل' : 'Full name'}>
            <div className="flex gap-2">
              <Input value={name} onChange={setName} placeholder={isAr ? 'اسمك الكامل' : 'Your full name'} />
              <SaveBtn loading={nameLoading} saved={nameSaved} onClick={saveName} label={isAr ? 'حفظ' : 'Save'} />
            </div>
            <ErrorMsg msg={nameError} />
          </Field>

          <Field label={isAr ? 'البريد الإلكتروني' : 'Email address'}>
            <Input value={profile?.email || session.user.email || ''} disabled />
            <p className="text-xs text-gray-600 mt-1">
              {isAr ? 'البريد الإلكتروني لا يمكن تغييره' : 'Email address cannot be changed'}
            </p>
          </Field>

          <div className="flex gap-6 pt-1 border-t border-white/4">
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">
                {isAr ? 'تاريخ الانضمام' : 'Member since'}
              </div>
              <div className="text-sm text-gray-300 font-mono">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString(isAr ? 'ar-MA' : 'en-GB', { year: 'numeric', month: 'long' })
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">
                {isAr ? 'السير الذاتية' : 'CVs created'}
              </div>
              <div className="text-sm text-gray-300 font-mono">{profile?.cvCount ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">
                {isAr ? 'رصيد الذكاء المستخدم' : 'AI credits used'}
              </div>
              <div className="text-sm text-gray-300 font-mono">{profile?.aiCreditsUsed ?? '—'}</div>
            </div>
          </div>
        </Section>

        {/* ── Plan & Billing ─────────────────────────────────────────── */}
        <Section
          title={isAr ? 'الخطة والفوترة' : 'Plan & Billing'}
          badge={`${planIcon} ${isAr ? planDef.nameAr : planDef.name}`}
        >
          {/* Plan info */}
          <div className="flex items-center justify-between p-4 rounded-xl border" style={{
            background: planColor + '08',
            borderColor: planColor + '25',
          }}>
            <div>
              <div className="text-sm font-black" style={{ color: planColor }}>
                {planIcon} {isAr ? planDef.nameAr : planDef.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {plan === 'PRO'
                  ? (isAr ? 'ذكاء اصطناعي غير محدود · جميع الميزات' : 'Unlimited AI · All features')
                  : plan === 'STARTER'
                  ? (isAr ? `${planDef.aiCredits} رصيد ذكاء اصطناعي · كل الميزات` : `${planDef.aiCredits} AI credits · All features`)
                  : (isAr ? `${planDef.aiCredits} أرصدة مجانية` : `${planDef.aiCredits} free credits`)}
              </div>
            </div>
            {plan !== 'PRO' && (
              <a
                href={`/api/payment/checkout?plan=${plan === 'FREE' ? 'STARTER' : 'PRO'}`}
                className="text-xs px-4 py-2 rounded-xl font-bold transition-all"
                style={{
                  background: planColor + '15',
                  color: planColor,
                  border: `1px solid ${planColor}30`,
                }}
              >
                {isAr ? 'ترقية ←' : 'Upgrade →'}
              </a>
            )}
          </div>

          {/* AI credits bar */}
          {plan !== 'PRO' && profile && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">{isAr ? 'الأرصدة المستخدمة' : 'Credits used'}</span>
                <span className="text-xs font-mono text-gray-400">
                  {profile.aiCreditsUsed} / {planDef.aiCredits}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (profile.aiCreditsUsed / planDef.aiCredits) * 100)}%`,
                    background: profile.aiCreditsUsed >= planDef.aiCredits
                      ? '#EF4444'
                      : profile.aiCreditsUsed >= planDef.aiCredits * 0.8
                      ? '#F59E0B'
                      : '#10B981',
                  }}
                />
              </div>
            </div>
          )}

          {/* Payment history */}
          {profile?.payments && profile.payments.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                {isAr ? 'سجل المدفوعات' : 'Payment history'}
              </div>
              <div className="space-y-2">
                {profile.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 text-xs">✓</span>
                      <div>
                        <div className="text-xs font-bold text-white capitalize">{p.plan}</div>
                        <div className="text-xs text-gray-600 font-mono">
                          {new Date(p.createdAt).toLocaleDateString(isAr ? 'ar-MA' : 'en-GB')}
                        </div>
                      </div>
                    </div>
                    {p.amount && (
                      <span className="text-xs text-gray-400 font-mono">
                        {(p.amount / 100).toFixed(2)} {(p.currency || 'USD').toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Security ───────────────────────────────────────────────── */}
        <Section title={isAr ? 'الأمان وكلمة المرور' : 'Security & Password'}>
          {/* Google sign-in notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-blue-400">
            <span className="text-base">🔗</span>
            {isAr
              ? 'حسابك مرتبط بـ Google — تسجيل الدخول بـ Google لا يتطلب كلمة مرور'
              : 'Your account is linked via Google — no password required to sign in'}
          </div>

          <Field label={isAr ? 'كلمة المرور الحالية' : 'Current password'}>
            <Input type="password" value={curPwd} onChange={setCurPwd} placeholder="••••••••" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={isAr ? 'كلمة المرور الجديدة' : 'New password'}>
              <Input type="password" value={newPwd} onChange={setNewPwd} placeholder="••••••••" />
            </Field>
            <Field label={isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}>
              <Input type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="••••••••" />
            </Field>
          </div>
          {newPwd && (
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{
                    background: i <= Math.min(4, Math.floor(newPwd.length / 3))
                      ? newPwd.length >= 12 ? '#10B981' : newPwd.length >= 8 ? '#C9A84C' : '#EF4444'
                      : 'rgba(255,255,255,0.08)'
                  }}
                />
              ))}
            </div>
          )}
          <ErrorMsg msg={pwdError} />
          <SaveBtn
            loading={pwdLoading}
            saved={pwdSaved}
            onClick={changePassword}
            label={isAr ? 'تحديث كلمة المرور' : 'Update password'}
          />
        </Section>

        {/* ── Danger Zone ────────────────────────────────────────────── */}
        <Section title={isAr ? 'منطقة الخطر' : 'Danger Zone'}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-red-400 mb-1">
                {isAr ? 'حذف الحساب نهائياً' : 'Delete account permanently'}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {isAr
                  ? 'سيتم حذف جميع سيرتك الذاتية وخطابات التقديم والوظائف المحفوظة. هذا الإجراء لا يمكن التراجع عنه.'
                  : 'All your CVs, cover letters, and saved jobs will be permanently erased. This action cannot be undone.'}
              </p>
            </div>
            <button
              onClick={() => setDeleteOpen(!deleteOpen)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all"
            >
              {isAr ? 'حذف الحساب' : 'Delete account'}
            </button>
          </div>

          {deleteOpen && (
            <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/4 space-y-3">
              <div className="text-xs font-bold text-red-400">
                {isAr ? '⚠ تأكيد حذف الحساب' : '⚠ Confirm account deletion'}
              </div>
              <Field label={isAr ? 'كلمة المرور للتأكيد' : 'Password to confirm'}>
                <Input
                  type="password"
                  value={deletePwd}
                  onChange={setDeletePwd}
                  placeholder={isAr ? 'أدخل كلمة مرورك' : 'Enter your password'}
                />
              </Field>
              <ErrorMsg msg={deleteError} />
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={deleteLoading || !deletePwd}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all disabled:opacity-40"
                >
                  {deleteLoading ? '…' : (isAr ? '✕ حذف حسابي نهائياً' : '✕ Delete my account')}
                </button>
                <button
                  onClick={() => { setDeleteOpen(false); setDeleteError(''); setDeletePwd('') }}
                  className="px-5 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 border border-white/6 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Sign out */}
        <div className="text-center pt-2">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {isAr ? 'تسجيل الخروج' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}
