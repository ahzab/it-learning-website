// app/page.tsx
import { Navbar }               from '@/components/layout/Navbar'
import { HeroSection }          from '@/components/layout/HeroSection'
import { CountriesSection }     from '@/components/layout/CountriesSection'
import { FeaturesSection }      from '@/components/layout/FeaturesSection'
import { IntelligenceTeaser }   from '@/components/layout/IntelligenceTeaser'
import { TestimonialsSection }  from '@/components/layout/TestimonialsSection'
import { PricingSection }       from '@/components/layout/PricingSection'
import { CTASection }           from '@/components/layout/CTASection'
import { Footer }               from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <CountriesSection />
      <FeaturesSection />
      <IntelligenceTeaser />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
