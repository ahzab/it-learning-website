// app/templates/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TEMPLATES } from '@/components/cv/templates'
import { GoldenTemplate } from '@/components/cv/templates/GoldenTemplate'
import { CasablancaTemplate } from '@/components/cv/templates/CasablancaTemplate'
import { GulfTemplate } from '@/components/cv/templates/GulfTemplate'
import { MinimalTemplate } from '@/components/cv/templates/MinimalTemplate'
import { TechTemplate } from '@/components/cv/templates/TechTemplate'
import { defaultCV, CVData } from '@/types/cv'
import Link from 'next/link'

// Sample data for template previews
const SAMPLE: CVData = {
  ...defaultCV,
  personal: {
    fullName: 'أحمد بنعلي',
    jobTitle: 'مطور Full Stack',
    email: 'ahmed@email.com',
    phone: '+212 6XX XXX XXX',
    location: 'الدار البيضاء، المغرب',
    summary: 'مطور برمجيات متخصص في تطوير تطبيقات الهاتف والويب، خبرة أكثر من 5 سنوات في React وNode.js.',
    nationality: 'مغربي',
    maritalStatus: 'أعزب',
    visaStatus: 'Residence Visa',
  },
  experience: [
    {
      id: '1',
      jobTitle: 'مطور Full Stack أول',
      company: 'شركة التقنية المتقدمة',
      startDate: 'يناير 2022',
      endDate: '',
      isCurrent: true,
      description: 'تطوير تطبيقات ويب وجوال لأكثر من 10 عملاء. زيادة أداء المنصة بنسبة 40%.',
      achievements: [],
    },
    {
      id: '2',
      jobTitle: 'مطور React Native',
      company: 'CIH Bank',
      startDate: 'مارس 2020',
      endDate: 'ديسمبر 2021',
      isCurrent: false,
      description: 'تطوير تطبيق الصيرفة المحمولة من الصفر. تجاوز 200,000 مستخدم نشط.',
      achievements: [],
    },
  ],
  education: [
    {
      id: '1',
      degree: 'بكالوريوس علوم الحاسوب',
      field: 'هندسة البرمجيات',
      institution: 'جامعة محمد الخامس — الرباط',
      startDate: '2016',
      endDate: '2020',
      gpa: 'ممتاز',
    },
  ],
  skills: [
    { id: '1', name: 'React / Next.js', level: 'expert' },
    { id: '2', name: 'React Native', level: 'advanced' },
    { id: '3', name: 'Node.js', level: 'advanced' },
    { id: '4', name: 'PostgreSQL', level: 'intermediate' },
    { id: '5', name: 'Docker', level: 'intermediate' },
    { id: '6', name: 'TypeScript', level: 'expert' },
  ],
  languages: [
    { id: '1', name: 'العربية', level: 'native' },
    { id: '2', name: 'الفرنسية', level: 'professional' },
    { id: '3', name: 'الإنجليزية', level: 'conversational' },
  ],
  certificates: [
    { id: '1', name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2023' },
    { id: '2', name: 'Meta React Developer', issuer: 'Meta', date: '2022' },
  ],
}

function TemplatePreview({ templateId }: { templateId: string }) {
  const data = { ...SAMPLE, template: templateId as any }
  if (templateId === 'golden') return <GoldenTemplate data={data} />
  if (templateId === 'casablanca') return <CasablancaTemplate data={data} />
  if (templateId === 'gulf') return <GulfTemplate data={data} />
  if (templateId === 'minimal') return <MinimalTemplate data={data} />
  if (templateId === 'tech') return <TechTemplate data={data} />
  return null
}

export default function TemplatesPage() {
  const [selected, setSelected] = useState('golden')
  const [hovering, setHovering] = useState<string | null>(null)
  const router = useRouter()

  const handleUse = () => {
    router.push(`/builder?template=${selected}`)
  }

  return (
    <div className="min-h-screen bg-[#080810]" dir="rtl">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#080810]/95 backdrop-blur border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-yellow-500 font-black text-xl">سيرتي.ai</Link>
        <h1 className="text-sm text-gray-400 font-semibold">اختر قالبك</h1>
        <button
          onClick={handleUse}
          className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-black text-sm hover:bg-yellow-400 transition-all"
        >
          استخدم هذا القالب ←
        </button>
      </nav>

      <div className="pt-20 flex h-screen">
        {/* Left: Template Cards */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-white/6 bg-[#0D0D18] pt-4 pb-10">
          <p className="text-xs text-gray-600 uppercase tracking-widest px-5 mb-4">القوالب المتاحة</p>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              onMouseEnter={() => setHovering(t.id)}
              onMouseLeave={() => setHovering(null)}
              className={`w-full text-right px-5 py-4 border-b border-white/5 transition-all ${
                selected === t.id ? 'bg-yellow-500/10 border-r-2 border-r-yellow-500' : 'hover:bg-white/3'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Swatch */}
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg border border-white/10"
                  style={{ background: t.preview }}
                >
                  {t.preview === '#FEFEFE' ? <span style={{ color: '#666' }}>{t.icon}</span> : <span style={{ color: 'rgba(255,255,255,0.6)' }}>{t.icon}</span>}
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-sm ${selected === t.id ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {t.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{t.desc}</div>
                  <span
                    className="inline-block text-xs px-2 py-0.5 rounded-full mt-1.5 font-bold"
                    style={{ background: t.badgeBg, color: t.badgeColor }}
                  >
                    {t.badge}
                  </span>
                </div>
                {selected === t.id && <span className="text-yellow-400 text-sm">✓</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Right: Full Template Preview */}
        <div className="flex-1 overflow-y-auto bg-[#080810] p-8">
          <div className="max-w-2xl mx-auto">
            {/* Badge */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {TEMPLATES.filter(t => t.id === selected).map(t => (
                  <div key={t.id}>
                    <span
                      className="text-xs px-3 py-1 rounded-full font-bold"
                      style={{ background: t.badgeBg, color: t.badgeColor }}
                    >
                      {t.badge}
                    </span>
                    <h2 className="text-xl font-black mt-2">{t.label}</h2>
                    <p className="text-gray-500 text-sm">{t.desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUse}
                className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-black hover:bg-yellow-400 transition-all"
              >
                ابدأ بهذا القالب ←
              </button>
            </div>

            {/* Template render */}
            <div className="shadow-2xl">
              <TemplatePreview templateId={selected} />
            </div>

            <p className="text-center text-gray-600 text-xs mt-6">معاينة بيانات نموذجية — سيتم استبدالها ببياناتك</p>
          </div>
        </div>
      </div>
    </div>
  )
}
