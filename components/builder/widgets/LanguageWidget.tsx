'use client'
// components/builder/widgets/LanguageWidget.tsx
import { useState } from 'react'
import { useCVStore } from '@/lib/store'

const LEVEL_INFO = {
  basic:         { pct:20, ar:'أساسي',    en:'Basic',          color:'#64748B' },
  conversational:{ pct:45, ar:'محادثة',   en:'Conversational', color:'#C9A84C' },
  professional:  { pct:70, ar:'احترافي',  en:'Professional',   color:'#22C55E' },
  native:        { pct:100, ar:'أصلية',   en:'Native',         color:'#06B6D4' },
}
const LEVELS = ['basic','conversational','professional','native'] as const

const QUICK = [
  {name:'العربية',  nameEn:'Arabic',  flag:'🇸🇦'},
  {name:'الفرنسية', nameEn:'French',  flag:'🇫🇷'},
  {name:'الإنجليزية',nameEn:'English',flag:'🇬🇧'},
  {name:'الإسبانية',nameEn:'Spanish', flag:'🇪🇸'},
  {name:'الألمانية',nameEn:'German',  flag:'🇩🇪'},
  {name:'الصينية',  nameEn:'Chinese', flag:'🇨🇳'},
]

export function LanguageWidget({ isEn }: { isEn: boolean }) {
  const languages        = useCVStore(s=>s.cv.languages)
  const addLang          = useCVStore(s=>s.addLanguageItem)
  const updateLang       = useCVStore(s=>s.updateLanguageItem)
  const removeLang       = useCVStore(s=>s.removeLanguageItem)
  const [custom, setCustom] = useState('')

  const names = new Set(languages.map(l=>l.name.toLowerCase()))
  const available = QUICK.filter(q=>!names.has((isEn?q.nameEn:q.name).toLowerCase()))

  const add = (name: string) => {
    const n = name.trim()
    if (n && !names.has(n.toLowerCase())) { addLang(n); setCustom('') }
  }

  return (
    <div className="space-y-3">
      {languages.map(lang => {
        const info = LEVEL_INFO[lang.level as keyof typeof LEVEL_INFO] || LEVEL_INFO.professional
        return (
          <div key={lang.id} className="bg-[#181824] border border-white/8 rounded-2xl p-4 hover:border-white/14 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-white">{lang.name}</div>
                <div className="text-xs font-semibold mt-0.5" style={{color:info.color}}>{isEn?info.en:info.ar}</div>
              </div>
              <button onClick={()=>removeLang(lang.id)} className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all text-xl leading-none">×</button>
            </div>
            <div className="h-1 bg-white/6 rounded-full mb-3 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{width:`${info.pct}%`, background:info.color}} />
            </div>
            <div className="grid grid-cols-4 gap-1">
              {LEVELS.map(l => {
                const linfo = LEVEL_INFO[l], active = l === lang.level
                return (
                  <button key={l} onClick={()=>updateLang(lang.id,{level:l as any})}
                    className={`text-[10px] py-1 rounded-lg transition-all font-medium ${active?'font-bold':'text-gray-600 hover:text-gray-400'}`}
                    style={active?{color:linfo.color, background:linfo.color+'18', border:`1px solid ${linfo.color}30`}:{}}>
                    {isEn?linfo.en:linfo.ar}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="bg-[#0E0E18] rounded-2xl border border-white/6 p-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-3">{isEn?'Add language':'إضافة لغة'}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {available.map(l => (
            <button key={l.flag} onClick={()=>add(isEn?l.nameEn:l.name)}
              className="text-sm px-3 py-1.5 rounded-xl border border-white/8 text-gray-400 hover:border-yellow-500/35 hover:text-yellow-300 hover:bg-yellow-500/5 transition-all flex items-center gap-1.5">
              <span>{l.flag}</span> {isEn?l.nameEn:l.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={custom} onChange={e=>setCustom(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter')add(custom)}}
            placeholder={isEn?'Other language...':'لغة أخرى...'}
            className="flex-1 bg-[#181824] border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-yellow-500/40 focus:outline-none transition-all" />
          <button onClick={()=>add(custom)} disabled={!custom.trim()} className="px-4 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 font-bold text-sm hover:bg-yellow-500/25 disabled:opacity-30 transition-all">+</button>
        </div>
      </div>
    </div>
  )
}
