import { LandingAiSection } from './components/LandingAiSection'
import { LandingCta } from './components/LandingCta'
import { LandingFeatures } from './components/LandingFeatures'
import { LandingFooter } from './components/LandingFooter'
import { LandingHero } from './components/LandingHero'
import { LandingHowItWorks } from './components/LandingHowItWorks'
import { LandingNavbar } from './components/LandingNavbar'
import { LandingUserTypes } from './components/LandingUserTypes'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingUserTypes />
        <LandingAiSection />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
