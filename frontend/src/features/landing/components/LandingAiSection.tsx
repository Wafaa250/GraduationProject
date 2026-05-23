import { motion } from 'framer-motion'
import { Brain, LineChart, Shield, Sparkles, Zap } from 'lucide-react'

const capabilities = [
  {
    icon: Brain,
    label: 'Teammate & supervisor ranking',
    detail: 'Context from project title, abstract, and required skills',
  },
  {
    icon: Zap,
    label: 'Course team generation',
    detail: 'Balanced groups when instructors run doctor-led AI mode',
  },
  {
    icon: LineChart,
    label: 'Talent & applicant analysis',
    detail: 'Companies and organizations get scored candidates with reasons',
  },
  {
    icon: Shield,
    label: 'Graceful fallback',
    detail: 'Skill overlap keeps flows working when AI is unavailable',
  },
] as const

export function LandingAiSection() {
  return (
    <section id="ai" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-glow overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/10">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-14">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Intelligent matching
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                AI that explains itself
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
                Recommendations are not black boxes. SkillSwap surfaces match scores and
                human-readable reasons so students, faculty, and recruiters can trust the
                suggestions they act on.
              </p>
              <ul className="mt-10 space-y-5">
                {capabilities.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="relative min-h-[300px] overflow-hidden border-t border-border bg-gradient-to-br from-muted/60 via-accent/30 to-background p-8 sm:p-10 lg:border-t-0 lg:border-l lg:min-h-0">
              <div className="absolute inset-0 dot-pattern opacity-50" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative mb-4 rounded-xl glass-card border border-white/50 p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Supervisor match
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-lg font-semibold text-foreground">Dr. Nasser</p>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-bold text-primary-foreground">
                    91%
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Specialization aligns with distributed systems and your required ML stack.
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(262_70%_52%)]"
                    initial={{ width: 0 }}
                    whileInView={{ width: '91%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="relative ml-6 rounded-xl glass-card border border-white/50 p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Talent search
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-lg font-semibold text-foreground">React intern</p>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                    89%
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Strong frontend portfolio; availability matches 3-month engagement.
                </p>
              </motion.div>

              <div className="relative mt-6 rounded-xl border border-dashed border-primary/35 bg-primary/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-accent-foreground">
                  Skill overlap fallback when AI is offline — flows never break.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
