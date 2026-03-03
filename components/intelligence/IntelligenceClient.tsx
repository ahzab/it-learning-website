'use client'
import { useT } from '@/lib/i18n/context'
// components/intelligence/IntelligenceClient.tsx
// Thin client wrapper — passes server-fetched CV data into the dashboard.

import { IntelligenceDashboard } from './IntelligenceDashboard'

interface Props {
  cvData: any
  cvTitle: string
  isAr: boolean
}

export function IntelligenceClient({ cvData, cvTitle, isAr: isArProp }: Props) {
  const { isRTL } = useT()
  const isAr = isRTL // use UI locale, not URL param
  return (
    <IntelligenceDashboard
      cvData={cvData}
      cvTitle={cvTitle}
      isAr={isAr}
    />
  )
}
