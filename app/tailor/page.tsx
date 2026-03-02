// app/tailor/page.tsx
import { TailorClient } from '@/components/tailor/TailorClient'

export const metadata = {
  title: 'خصّص سيرتك لوظيفة | سيرتي',
}

export default function TailorPage() {
  return <TailorClient />
}
