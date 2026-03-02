// components/cv/templates/index.ts
export { GoldenTemplate } from './GoldenTemplate'
export { CasablancaTemplate } from './CasablancaTemplate'
export { GulfTemplate } from './GulfTemplate'
export { MinimalTemplate } from './MinimalTemplate'
export { TechTemplate } from './TechTemplate'

export const TEMPLATES = [
  {
    id: 'golden',
    label: 'الذهبي',
    labelEn: 'Golden Executive',
    icon: '◆',
    badge: 'مثالي للخليج',
    badgeColor: '#C9A84C',
    badgeBg: 'rgba(201,168,76,0.1)',
    desc: 'فاخر وأنيق للمديرين والمحترفين',
    preview: '#0D0D0D',
  },
  {
    id: 'casablanca',
    label: 'الدار البيضاء',
    labelEn: 'Casablanca',
    icon: '◈',
    badge: 'مثالي للمغرب',
    badgeColor: '#10B981',
    badgeBg: 'rgba(16,185,129,0.1)',
    desc: 'جريء وعصري بألوان مغربية',
    preview: '#0D4F3C',
  },
  {
    id: 'gulf',
    label: 'الخليجي',
    labelEn: 'Gulf Executive',
    icon: '❖',
    badge: 'مثالي للخليج',
    badgeColor: '#4A90D9',
    badgeBg: 'rgba(74,144,217,0.1)',
    desc: 'رسمي مع حقول خاصة بالخليج',
    preview: '#0f3460',
  },
  {
    id: 'minimal',
    label: 'البسيط',
    labelEn: 'Minimal',
    icon: '○',
    badge: 'للمبدعين',
    badgeColor: '#111',
    badgeBg: 'rgba(0,0,0,0.06)',
    desc: 'نقاء تام وطباعة راقية',
    preview: '#FEFEFE',
  },
  {
    id: 'tech',
    label: 'التقني',
    labelEn: 'Tech Arabic',
    icon: '⌘',
    badge: 'للمطورين',
    badgeColor: '#06B6D4',
    badgeBg: 'rgba(6,182,212,0.1)',
    desc: 'أسلوب مطوري البرمجيات',
    preview: '#0F1117',
  },
]
