import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, UserRound, Users } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { ROUTES } from '@/shared/constants/routes'
import { LandingHeroBackground } from './hero/LandingHeroBackground'
import { LandingHeroDashboard } from './hero/LandingHeroDashboard'
import { LandingFloatingAiCard } from './hero/LandingFloatingAiCard'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const valuePills = [
  { icon: Users, label: 'Teammate matching' },
  { icon: UserRound, label: 'Supervisor fit' },
] as const

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-24 sm:pt-32 sm:pb-32 lg:pt-36 lg:pb-40">
      <LandingHeroBackground />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20 xl:gap-28">
          <div className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered academic matching platform
            </motion.div>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-8 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl xl:text-[3.25rem]"
            >
              <span className="text-gradient-hero">Match the right people</span>
              <br />
              <span className="text-gradient">for every academic project.</span>
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Teams and supervisors ranked by skills and context—not connections.
            </motion.p>

            <motion.ul
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
            >
              {valuePills.map((pill) => (
                <li
                  key={pill.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <pill.icon className="h-4 w-4 text-primary" />
                  {pill.label}
                </li>
              ))}
            </motion.ul>

            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <Button size="lg" className="h-12 px-6" asChild>
                <Link to={ROUTES.register}>
                  Start matching
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12" asChild>
                <a href="#how-it-works">See how it works</a>
              </Button>
            </motion.div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="relative px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
              <LandingHeroDashboard />

              <LandingFloatingAiCard
                variant="teammate"
                className="-top-2 right-0 sm:-top-4 sm:right-2"
                animationClass="animate-float-delay-1"
                delay={0.65}
              />
              <LandingFloatingAiCard
                variant="supervisor"
                className="-bottom-2 left-0 sm:-bottom-4 sm:left-2"
                animationClass="animate-float-delay-2"
                delay={0.8}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
