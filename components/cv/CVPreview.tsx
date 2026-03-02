'use client'
// components/cv/CVPreview.tsx
import { CVData } from '@/types/cv'
import { GoldenTemplate }     from './templates/GoldenTemplate'
import { CasablancaTemplate } from './templates/CasablancaTemplate'
import { GulfTemplate }       from './templates/GulfTemplate'
import { MinimalTemplate }    from './templates/MinimalTemplate'
import { TechTemplate }       from './templates/TechTemplate'
import { BilingualTemplate }  from './templates/bilingual/BilingualTemplate'

interface Props { data: CVData }

function TemplateSwitch({ data }: { data: CVData }) {
  // All modes (ar / en / bilingual) use the selected template.
  // Each template reads data.cvMode internally and renders accordingly.
  switch (data.template) {
    case 'casablanca': return <CasablancaTemplate data={data} />
    case 'gulf':       return <GulfTemplate       data={data} />
    case 'minimal':    return <MinimalTemplate    data={data} />
    case 'tech':       return <TechTemplate       data={data} />
    default:           return <GoldenTemplate     data={data} />
  }
}

export function CVPreview({ data }: Props) {
  const isEmpty = !data.personal.fullName && !data.personal.fullNameEn && data.experience.length === 0 && data.skills.length === 0

  if (isEmpty) {
    return (
      <div style={{ background: '#111118', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✏️</div>
        <p style={{ color: '#666', fontSize: 14 }}>
          {data.cvMode === 'en' ? 'Start filling in your details to preview' : 'ابدأ بملء البيانات لترى سيرتك هنا'}
        </p>
      </div>
    )
  }

  return (
    <div id="cv-to-print">
      <TemplateSwitch data={data} />
    </div>
  )
}

export default CVPreview
