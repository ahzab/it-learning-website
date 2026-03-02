// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300','400','500','600','700','900'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'سيرتي.ai — منصة الذكاء المهني العربية الأولى',
  description: 'أنشئ سيرة ذاتية احترافية بالعربية والإنجليزية. تحليل رواتب، فجوات مهارات، وقوالب مخصصة للسوق المغربي والخليجي.',
  keywords: ['سيرة ذاتية', 'CV عربي', 'resume builder arabic', 'ذكاء اصطناعي', 'سوق العمل الخليجي', 'المغرب', 'الإمارات'],
  openGraph: {
    title: 'سيرتي.ai — أكثر من مجرد سيرة ذاتية',
    description: 'ذكاء مهني متكامل: سيرة ذاتية + تحليل رواتب + فجوات مهارات للسوق العربي',
    locale: 'ar_MA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سيرتي.ai',
    description: 'منصة الذكاء المهني العربية الأولى',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,   // prevent iOS auto-zoom on input focus
  userScalable: false,
  viewportFit: 'cover', // expose safe-area-inset-* for notched phones
  themeColor: '#0A0A0F',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Default to Arabic/RTL — the I18nProvider in Providers will update
    // lang and dir on the client based on localStorage preference
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} antialiased`} style={{ background:'#060608', color:'#F0EBE0' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
