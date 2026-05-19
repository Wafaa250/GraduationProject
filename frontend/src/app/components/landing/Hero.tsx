import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SkillSwapMark } from '../brand/SkillSwapMark'
import { Button } from '../ui/button'
import { LandingInsightsPreview } from './LandingInsightsPreview'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute inset-0 surface-grid opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai-soft px-3 py-1 text-xs font-semibold text-ai">
            <SkillSwapMark size={14} className="text-ai" />
            AI matching for university collaboration
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Put the <span className="gradient-text">right person</span> in the right{' '}
            <span className="gradient-text-ai">project</span>.
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            AI-powered collaboration for university projects, teams, and opportunities.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow hover:opacity-95">
              <Link to="/register">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">Explore matches</a>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <div className="rounded-3xl border border-border bg-card p-1 shadow-pop">
            <div className="rounded-[1.4rem] bg-gradient-to-br from-card to-background p-6 sm:p-8">
              <LandingInsightsPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
