// app/generate/page.tsx
import { GenerateClient } from '@/components/generate/GenerateClient'

export const metadata = {
  title: 'أنشئ سيرتك الذاتية بالذكاء الاصطناعي | سيرتي',
}

export default function GeneratePage() {
  return <GenerateClient />
}
