'use client'
// components/builder/BuilderClient.tsx
// Multi-language builder. UI language comes from useT() (the app locale: ar/en/fr).
// cv.cvMode controls which CONTENT fields are shown/edited (ar/en/bilingual).

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { useCVStore }           from '@/lib/store'
import { useT }                 from '@/lib/i18n/context'
import { CVData }               from '@/types/cv'
import { PersonalForm }         from './forms/PersonalForm'
import { ExperienceForm }       from './forms/ExperienceForm'
import { EducationForm }        from './forms/EducationForm'
import { SkillsForm }           from './forms/SkillsForm'
import { CVPreview }            from '../cv/CVPreview'
import { TemplateSelector }     from './TemplateSelector'
import { LanguageModeSelector } from './LanguageModeSelector'
import { DownloadButton }       from './DownloadButton'
import { AIAssistantPanel }     from './ai/AIAssistantPanel'
import { SaveIndicator }        from './SaveIndicator'
import { TitleModal }           from './TitleModal'
import { ResizeHandle }         from './ResizeHandle'
import { AICreditsBadge }       from './AICreditsBadge'
import { useSaveCV }            from '@/hooks/useSaveCV'
import { usePanelResize }       from '@/hooks/usePanelResize'
import { SectionProgress }      from './widgets/SectionProgress'

const MemoPersonalForm   = memo(PersonalForm)
const MemoExperienceForm = memo(ExperienceForm)
const MemoEducationForm  = memo(EducationForm)
const MemoSkillsForm     = memo(SkillsForm)

function useDebouncedCV(cv: CVData, delay = 400): CVData {
  const [debounced, setDebounced] = useState(cv)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setDebounced(cv), delay)
    return () => clearTimeout(timer.current)
  }, [cv, delay])
  return debounced
}

// Mobile views: 'form' | 'preview' | 'ai'
type MobileTab = 'form' | 'preview' | 'ai'

interface BuilderProps {
  initialTemplate?: string
  cvId?:            string
}

const PREVIEW_SIZES = [
  { label: 'S', px: 300 },
  { label: 'M', px: 440 },
  { label: 'L', px: 600 },
]

export function BuilderClient({ initialTemplate, cvId: initialCvId }: BuilderProps) {
  const { t, isRTL } = useT()
  // Guard: t.builder can be undefined during SSR/hydration or with a broken locale file
  const b = t.builder

  const { activeSection, setActiveSection, cv, updateTemplate } = useCVStore()
  const [mobileTab,      setMobileTab]      = useState<MobileTab>('form')
  const [showAI,         setShowAI]         = useState(false)
  const [showTitleModal, setShowTitleModal] = useState(false)

  const previewCV = useDebouncedCV(cv)
  const { saveStatus, lastSaved, title, setTitle, saveNow } = useSaveCV(initialCvId)

  const cvMode      = cv.cvMode || 'ar'
  const isBilingual = cvMode === 'bilingual'

  useEffect(() => {
    if (initialTemplate) updateTemplate(initialTemplate as any)
  }, [initialTemplate, updateTemplate])

  const SECTIONS = [
    { id: 'personal',   label: b?.sectionPersonal   ?? 'Personal',   icon: '👤' },
    { id: 'experience', label: b?.sectionExperience  ?? 'Experience',  icon: '💼' },
    { id: 'education',  label: b?.sectionEducation   ?? 'Education',   icon: '🎓' },
    { id: 'skills',     label: b?.sectionSkills      ?? 'Skills',      icon: '⚡' },
  ]

  const modeBadge =
    isBilingual     ? { text: b?.modeBilingual ?? 'Bilingual', cls: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' } :
    cvMode === 'en' ? { text: b?.modeEn ?? 'EN',               cls: 'border-blue-500/40 text-blue-400 bg-blue-500/10' }      :
                      { text: b?.modeAr ?? 'AR',               cls: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' }

  // Desktop resize panels
  const previewPanel = usePanelResize({
    storageKey: 'seerti_preview_w', defaultSize: 440, min: 260, max: 680, direction: 'shrink-right',
  })
  const aiPanel = usePanelResize({
    storageKey: 'seerti_ai_w', defaultSize: 340, min: 240, max: 520, direction: 'shrink-right',
  })

  const isAnyDragging = previewPanel.isDragging || aiPanel.isDragging

  const saveBtnCls =
    saveStatus === 'saved'  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' :
    saveStatus === 'saving' ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed' :
    saveStatus === 'error'  ? 'bg-red-500/15 border border-red-500/30 text-red-400' :
    'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25'

  const saveBtnLabel =
    saveStatus === 'saving' ? (b?.savingBtn ?? 'Saving…') :
    saveStatus === 'saved'  ? (b?.savedBtn  ?? 'Saved')   :
    saveStatus === 'error'  ? (b?.retryBtn  ?? 'Retry')   :
    (b?.saveBtn ?? 'Save')

  const saveIcon =
    saveStatus === 'saving' ? <span className="animate-spin inline-block">⟳</span> :
    saveStatus === 'saved'  ? <span>✓</span> :
    saveStatus === 'error'  ? <span>✕</span> :
    <span>💾</span>

  return (
    <div
      className="bg-[#0A0A0F] flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        height: '100dvh',
        minHeight: '100vh',
        userSelect: isAnyDragging ? 'none' : undefined,
      }}
    >
      {showTitleModal && (
        <TitleModal
          title={title}
          isEn={!isRTL}
          onClose={() => setShowTitleModal(false)}
          onSave={(t) => { setTitle(t); setTimeout(saveNow, 100) }}
        />
      )}

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 z-40 bg-[#0A0A0F]/95 backdrop-blur border-b border-white/8 flex items-center justify-between gap-2"
        style={{ padding: '0 16px', height: 52 }}>

        {/* Left: logo + title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
          <a href="/" className="text-yellow-500 font-black text-lg flex-shrink-0 leading-none">سيرتي.ai</a>
          <button
            onClick={() => setShowTitleModal(true)}
            className="hidden sm:flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors group min-w-0"
          >
            <span className="truncate max-w-[160px]">{title}</span>
            <span className="text-gray-700 group-hover:text-gray-400 text-xs flex-shrink-0">✎</span>
          </button>
          <span className={`hidden lg:inline text-xs px-2 py-1 rounded-md border font-bold flex-shrink-0 ${modeBadge.cls}`}>
            {modeBadge.text}
          </span>
        </div>

        {/* Center: mobile tab switcher */}
        <div className="flex items-center gap-1 md:hidden">
          {([
            { tab: 'form'    as MobileTab, label: b?.tabEdit ?? 'Edit',   icon: '📝' },
            { tab: 'preview' as MobileTab, label: b?.tabPreview ?? 'Preview', icon: '👁'  },
            { tab: 'ai'      as MobileTab, label: 'AI',         icon: '✦'  },
          ]).map(({ tab, label, icon }) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={[
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all',
                'min-h-[40px] min-w-[60px]',
                mobileTab === tab
                  ? tab === 'ai'
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                    : 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
                  : 'border-white/10 text-gray-500',
              ].join(' ')}
            >
              <span className="text-sm leading-none">{icon}</span>
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Right: save + desktop AI + download */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={saveNow}
            disabled={saveStatus === 'saving'}
            className={[
              'md:hidden flex items-center justify-center w-9 h-9 rounded-lg border text-sm transition-all',
              saveStatus === 'saved'  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
              saveStatus === 'saving' ? 'border-white/10 text-gray-600 cursor-not-allowed' :
              saveStatus === 'error'  ? 'border-red-500/30 text-red-400 bg-red-500/10' :
              'border-white/10 text-gray-400 active:bg-white/10',
            ].join(' ')}
            aria-label={b?.save ?? 'Save'}
          >
            {saveStatus === 'saving' ? <span className="animate-spin text-xs">⟳</span> :
             saveStatus === 'saved'  ? <span>✓</span> :
             saveStatus === 'error'  ? <span>!</span> :
             <span>💾</span>}
          </button>

          <div className="hidden md:flex">
            <SaveIndicator status={saveStatus} lastSaved={lastSaved} onSave={saveNow} isEn={!isRTL} />
          </div>

          <button
            onClick={() => setShowAI(v => !v)}
            className={[
              'hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-bold transition-all',
              showAI
                ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                : 'border-white/10 text-gray-400 hover:border-purple-500/30 hover:text-purple-400',
            ].join(' ')}
          >
            ✦ AI
          </button>

          <AICreditsBadge />
          <DownloadButton />
        </div>
      </header>

      {/* ── Main body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ═══ SIDEBAR ════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col w-52 bg-[#111118] border-s border-white/8 flex-shrink-0 overflow-y-auto order-last">
          <div className="py-5 flex flex-col flex-1 gap-1">
            <SectionProgress activeSection={activeSection} onSectionClick={setActiveSection} isEn={!isRTL} />

            <div className="border-t border-white/8 my-3" />
            <div className="px-4"><LanguageModeSelector /></div>

            <div className="border-t border-white/8 my-3" />
            <div className="px-4"><TemplateSelector /></div>

            {isBilingual && (
              <div className="px-4 mt-2">
                <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
                  <p className="text-xs text-yellow-400 font-bold mb-1">{b?.bilingualTitle ?? 'Bilingual Mode'}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{b?.bilingualHint ?? ''}</p>
                </div>
              </div>
            )}

            <div className="border-t border-white/8 mt-auto pt-4 mx-4 mb-2 space-y-2">
              <button onClick={() => setShowTitleModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/8 hover:border-white/20 transition-colors group">
                <span className="text-sm flex-1 text-gray-400 group-hover:text-white truncate text-start">{title}</span>
                <span className="text-gray-700 group-hover:text-gray-400 text-xs">✎</span>
              </button>

              <button onClick={saveNow} disabled={saveStatus === 'saving'}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${saveBtnCls}`}>
                {saveIcon}
                <span>{saveBtnLabel}</span>
              </button>

              {lastSaved && saveStatus === 'idle' && (
                <p className="text-xs text-gray-700 text-center">
                  {b?.savedAt ?? 'Saved at'} {lastSaved.toLocaleTimeString(isRTL ? 'ar-MA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              {[
                { href: '/intelligence', cls: 'text-purple-500/70 hover:text-purple-400 hover:bg-purple-500/5 border-purple-500/10 hover:border-purple-500/20', label: b?.navIntelligence ?? 'Intelligence' },
                { href: '/tailor',       cls: 'text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20', label: b?.navTailor ?? 'Tailor' },
                { href: '/generate',     cls: 'text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/5 border-yellow-500/10 hover:border-yellow-500/20', label: b?.navGenerate ?? 'Generate' },
                { href: '/dashboard',    cls: 'text-gray-600 hover:text-gray-300 hover:bg-white/5 border-white/6', label: b?.navMyCVs ?? 'My CVs' },
              ].map(({ href, cls, label }) => (
                <a key={href} href={href}
                  className={`w-full py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border ${cls}`}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* ═══ FORM PANEL ═══════════════════════════════════════════ */}
        <main className={[
          'flex-1 overflow-y-auto min-w-0',
          mobileTab !== 'form' ? 'hidden md:block' : 'block',
        ].join(' ')}>
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-32 md:px-5 md:pb-8">
            {activeSection === 'personal'   && <MemoPersonalForm />}
            {activeSection === 'experience' && <MemoExperienceForm />}
            {activeSection === 'education'  && <MemoEducationForm />}
            {activeSection === 'skills'     && <MemoSkillsForm />}
          </div>
        </main>

        {/* ═══ PREVIEW PANEL ═══════════════════════════════════════════ */}
        {!showAI && (
          <>
            <ResizeHandle
              isDragging={previewPanel.isDragging}
              onMouseDown={previewPanel.onMouseDown}
              onTouchStart={previewPanel.onTouchStart}
              onDoubleClick={previewPanel.resetSize}
            />
            <aside
              className={[
                'resizable-panel bg-[#111118] border-e border-white/8 flex-shrink-0 flex flex-col min-w-0',
                mobileTab === 'preview' ? 'flex w-full md:w-auto' : 'hidden md:flex',
              ].join(' ')}
              style={{ '--panel-w': `${previewPanel.size}px` } as React.CSSProperties}
            >
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/6 bg-[#111118]/95 backdrop-blur sticky top-0 z-10">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                  {isBilingual ? b.bilingualPreview : b.livePreview}
                </span>
                <div className="flex items-center gap-1.5">
                  {previewPanel.isDragging && (
                    <span className="text-[10px] text-yellow-400/70 font-mono tabular-nums">{previewPanel.size}px</span>
                  )}
                  {PREVIEW_SIZES.map(({ label, px }) => (
                    <button key={label} onClick={() => previewPanel.setSize(px)}
                      className={[
                        'hidden md:flex text-[10px] w-6 h-6 rounded-md items-center justify-center border font-bold transition-all',
                        Math.abs(previewPanel.size - px) < 40
                          ? 'border-yellow-500/60 bg-yellow-500/15 text-yellow-400'
                          : 'border-white/10 text-gray-600 hover:border-white/25 hover:text-gray-300',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <CVPreview data={previewCV} />
              </div>

              <div className="hidden md:block flex-shrink-0 px-4 py-2 border-t border-white/5">
                <p className="text-[10px] text-gray-700 text-center">{b.dragToResizeReset}</p>
              </div>
            </aside>
          </>
        )}

        {/* ═══ AI PANEL ═══════════════════════════════════════════════ */}
        {(showAI || mobileTab === 'ai') && (
          <>
            {showAI && (
              <ResizeHandle
                isDragging={aiPanel.isDragging}
                onMouseDown={aiPanel.onMouseDown}
                onTouchStart={aiPanel.onTouchStart}
                onDoubleClick={aiPanel.resetSize}
              />
            )}
            <aside
              className={[
                'resizable-panel bg-[#0D0D18] border-e border-white/8 flex-shrink-0 flex flex-col min-w-0',
                mobileTab === 'ai' ? 'flex w-full md:w-auto' : 'hidden md:flex',
              ].join(' ')}
              style={{ '--panel-w': `${aiPanel.size}px` } as React.CSSProperties}
            >
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/6 bg-[#0D0D18]">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">✦</span>
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                    {b.aiAssistant}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {aiPanel.isDragging && (
                    <span className="text-[10px] text-purple-400/60 font-mono tabular-nums">{aiPanel.size}px</span>
                  )}
                  <button
                    onClick={() => { setShowAI(false); if (mobileTab === 'ai') setMobileTab('form') }}
                    className="hidden md:flex w-7 h-7 items-center justify-center rounded-lg text-gray-600 hover:text-gray-200 hover:bg-white/8 transition-all text-lg leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <AIAssistantPanel />
              </div>

              <div className="hidden md:block flex-shrink-0 px-4 py-2 border-t border-white/5">
                <p className="text-[10px] text-gray-700 text-center">{b.dragToResize}</p>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* ── Mobile bottom navigation ──────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#111118]/98 backdrop-blur border-t border-white/8"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setMobileTab('form') }}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors',
                'min-h-[52px]',
                activeSection === s.id && mobileTab === 'form'
                  ? 'text-yellow-400'
                  : 'text-gray-600 active:text-gray-300',
              ].join(' ')}
            >
              <span className="text-[18px] leading-none">{s.icon}</span>
              <span className="text-[10px] font-semibold leading-tight">{s.label}</span>
            </button>
          ))}

          <div className="w-px bg-white/8 self-stretch my-2" />

          <button
            onClick={saveNow}
            disabled={saveStatus === 'saving'}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors min-h-[52px]',
              saveStatus === 'saved'  ? 'text-emerald-400' :
              saveStatus === 'error'  ? 'text-red-400' :
              saveStatus === 'saving' ? 'text-gray-700 cursor-not-allowed' :
              'text-gray-600 active:text-gray-300',
            ].join(' ')}
          >
            <span className="text-[18px] leading-none">
              {saveStatus === 'saving' ? '⟳' : saveStatus === 'saved' ? '✓' : '💾'}
            </span>
            <span className="text-[10px] font-semibold leading-tight">
              {saveStatus === 'saving' ? '…' :
               saveStatus === 'saved'  ? b.saved :
               b?.save ?? 'Save'}
            </span>
          </button>
        </div>
      </nav>
    </div>
  )
}
