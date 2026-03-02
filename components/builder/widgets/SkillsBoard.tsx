'use client'
// components/builder/widgets/SkillsBoard.tsx
import { useState, useRef } from 'react'
import { useCVStore } from '@/lib/store'

const LEVELS = ['beginner','intermediate','advanced','expert'] as const
const LEVEL_CFG = {
  beginner:     { dots:1, ar:'مبتدئ',  en:'Beginner',     color:'#64748B' },
  intermediate: { dots:2, ar:'متوسط',  en:'Intermediate', color:'#C9A84C' },
  advanced:     { dots:3, ar:'متقدم',  en:'Advanced',     color:'#22C55E' },
  expert:       { dots:4, ar:'خبير',   en:'Expert',       color:'#06B6D4' },
}

const SUGGESTIONS: Record<string, [string, string, string[]]> = {
  frontend:   ['Frontend','الواجهة',['React','Next.js','Vue.js','TypeScript','Tailwind CSS','GraphQL','Figma']],
  backend:    ['Backend','الخادم',  ['Node.js','Python','Django','Laravel','PostgreSQL','MongoDB','Redis','Docker']],
  mobile:     ['Mobile','الجوال',  ['React Native','Flutter','Swift','Kotlin','Firebase','Expo']],
  data:       ['Data','البيانات', ['Python','SQL','Excel','Power BI','Tableau','Pandas','Scikit-learn']],
  management: ['Mgmt','الإدارة',  ['Project Management','Agile/Scrum','Jira','Leadership','Excel','Notion']],
  design:     ['Design','التصميم',['Figma','Adobe XD','Photoshop','Illustrator','Sketch','Canva']],
}

function LevelDots({ level, onChange }: { level:string; onChange:(l:string)=>void }) {
  const cfg = LEVEL_CFG[level as keyof typeof LEVEL_CFG] || LEVEL_CFG.intermediate
  return (
    <div className="flex gap-[3px] items-center group/dots">
      {LEVELS.map((l,i) => {
        const lc = LEVEL_CFG[l]
        return (
          <button key={l} onClick={e=>{e.stopPropagation();onChange(l)}} title={lc.en}
            className="relative group/dot p-0.5">
            <div className={`w-2 h-2 rounded-full transition-all duration-150 ${i<cfg.dots?'opacity-100':'opacity-20 group-hover/dots:opacity-40'}`}
              style={{background: i<cfg.dots ? cfg.color : '#374151'}} />
          </button>
        )
      })}
    </div>
  )
}

export function SkillsBoard({ isEn }: { isEn:boolean }) {
  const skills     = useCVStore(s=>s.cv.skills)
  const addSkill   = useCVStore(s=>s.addSkill)
  const removeSkill= useCVStore(s=>s.removeSkill)
  const updateSkill= useCVStore(s=>s.updateSkill)

  const [custom, setCustom] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [cat, setCat] = useState('frontend')
  const inputRef = useRef<HTMLInputElement>(null)

  const names = new Set(skills.map(s=>s.name.toLowerCase()))
  const catCfg = SUGGESTIONS[cat]
  const suggestions = catCfg[2].filter(s=>!names.has(s.toLowerCase()))

  const doAdd = (name: string) => {
    const n = name.trim()
    if (n && !names.has(n.toLowerCase())) { addSkill(n); setCustom(''); setShowAdd(false) }
  }

  return (
    <div className="space-y-4">
      {/* Tag cloud */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map(sk => {
            const cfg = LEVEL_CFG[sk.level as keyof typeof LEVEL_CFG] || LEVEL_CFG.intermediate
            return (
              <div key={sk.id} className="group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl bg-[#181824] border border-white/8 hover:border-white/16 transition-all duration-150">
                <span className="text-sm text-white/90 font-medium">{sk.name}</span>
                <LevelDots level={sk.level} onChange={l=>updateSkill(sk.id,{level:l as any})} />
                <button onClick={()=>removeSkill(sk.id)} className="w-4 h-4 rounded-md flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">×</button>
              </div>
            )
          })}
          {!showAdd && (
            <button onClick={()=>{setShowAdd(true);setTimeout(()=>inputRef.current?.focus(),50)}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-white/12 text-gray-600 hover:border-yellow-500/40 hover:text-yellow-400 transition-all text-sm">
              + {isEn?'Add':'أضف'}
            </button>
          )}
          {showAdd && (
            <div className="flex items-center gap-1.5">
              <input ref={inputRef} value={custom} onChange={e=>setCustom(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')doAdd(custom);if(e.key==='Escape')setShowAdd(false)}}
                placeholder={isEn?'Skill name...':'اسم المهارة...'}
                className="w-32 bg-[#1C1C2A] border border-yellow-500/40 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none" autoFocus />
              <button onClick={()=>doAdd(custom)} className="text-yellow-400 text-sm font-bold hover:text-yellow-300">✓</button>
              <button onClick={()=>setShowAdd(false)} className="text-gray-600 text-sm hover:text-gray-400">✕</button>
            </div>
          )}
        </div>
      )}

      {/* Suggestion panel */}
      <div className="bg-[#0E0E18] rounded-2xl border border-white/6 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">{isEn?'Quick add':'إضافة سريعة'}</span>
          <div className="flex gap-1 flex-wrap justify-end">
            {Object.entries(SUGGESTIONS).map(([k,[en,ar]])=>(
              <button key={k} onClick={()=>setCat(k)} className={`text-[11px] px-2 py-0.5 rounded-lg transition-all ${cat===k?'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25':'text-gray-600 hover:text-gray-400'}`}>
                {isEn?en:ar}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(s=>(
            <button key={s} onClick={()=>addSkill(s)}
              className="text-xs px-2.5 py-1 rounded-lg border border-white/8 text-gray-500 hover:border-yellow-500/35 hover:text-yellow-300 hover:bg-yellow-500/5 transition-all">
              + {s}
            </button>
          ))}
          {suggestions.length===0 && <span className="text-xs text-gray-700 italic">{isEn?'All added ✓':'تمت إضافة الكل ✓'}</span>}
        </div>
        {skills.length===0 && (
          <div className="mt-3 flex gap-2">
            <input value={custom} onChange={e=>setCustom(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'){doAdd(custom)}}}
              placeholder={isEn?'Or type a custom skill...':'أو اكتب مهارة مخصصة...'}
              className="flex-1 bg-[#181824] border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:border-yellow-500/40 focus:outline-none" />
            <button onClick={()=>doAdd(custom)} disabled={!custom.trim()} className="px-3 py-2 rounded-xl bg-yellow-500/15 text-yellow-400 text-sm font-bold disabled:opacity-30 hover:bg-yellow-500/25 transition-all">+</button>
          </div>
        )}
      </div>

      {/* Level legend */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-[10px] text-gray-700 uppercase tracking-widest">{isEn?'Tap dots to set level:':'انقر لتغيير المستوى:'}</span>
          {LEVELS.map(l=>(
            <div key={l} className="flex items-center gap-1">
              {Array.from({length:4},(_,i)=>(
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{background:i<LEVEL_CFG[l].dots?LEVEL_CFG[l].color:'#1F2937'}} />
              ))}
              <span className="text-[10px] text-gray-600 ml-1">{isEn?LEVEL_CFG[l].en:LEVEL_CFG[l].ar}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
