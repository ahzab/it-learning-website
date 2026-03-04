// app/jobs/page.tsx
import { JobsClient } from '@/components/jobs/JobsClient'

export const metadata = {
  title: 'وظائف | سيرتي.ai',
  description: 'آلاف الوظائف من أكبر بوابات التوظيف العربية — بتطابق ذكي مع سيرتك الذاتية',
}

export default function JobsPage() {
  return <JobsClient />
}
