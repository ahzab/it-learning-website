'use client'
// components/intelligence/IntelligenceClient.tsx
// Thin client wrapper — passes server-fetched CV data into the dashboard.

import { IntelligenceDashboard } from './IntelligenceDashboard'

interface Props {
  cvData: any
  cvTitle: string
  isAr: boolean
}

export function IntelligenceClient({ cvData, cvTitle, isAr }: Props) {
  return (
    <IntelligenceDashboard
      cvData={cvData}
      cvTitle={cvTitle}
      isAr={isAr}
    />
  )
}
