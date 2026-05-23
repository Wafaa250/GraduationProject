import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { ROUTES } from '@/shared/constants/routes'

export function LandingCta() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[hsl(262_65%_50%)] to-[hsl(245_72%_42%)]" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          </div>
          <div className="absolute inset-0 grid-pattern opacity-20" />

          <div className="relative px-8 py-16 text-center sm:px-14 sm:py-20">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Start matching today
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to match by skill, not by chance?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 sm:text-base">
              Join SkillSwap and start building teams, finding supervisors, and discovering
              opportunities—the collaboration layer your university deserves.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-white text-primary shadow-xl hover:bg-white/95"
                asChild
              >
                <Link to={ROUTES.register}>
                  Create your account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                asChild
              >
                <Link to={ROUTES.login}>Sign in</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
