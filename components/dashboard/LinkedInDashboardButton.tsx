'use client'
// components/dashboard/LinkedInDashboardButton.tsx
// Thin client island — renders a LinkedIn import pill on the dashboard.
// Kept separate because the dashboard page is a server component.

import { LinkedInImportButton } from '@/components/linkedin/LinkedInImportButton'

export function LinkedInDashboardButton() {
  return <LinkedInImportButton variant="compact" />
}
