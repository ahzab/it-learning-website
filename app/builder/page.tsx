// app/builder/page.tsx
import { BuilderClient } from '@/components/builder/BuilderClient'

export const metadata = {
  title: 'إنشاء سيرة ذاتية | سيرتي',
}

export default function BuilderPage({
  searchParams,
}: {
  searchParams: { template?: string; id?: string }
}) {
  return (
    <BuilderClient
      initialTemplate={searchParams.template}
      cvId={searchParams.id}
    />
  )
}
