import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { SkillSwapMark } from '@/shared/components/brand'

const recommendations = [
  { name: 'Sara M.', score: 94, width: '94%', delay: 0.45 },
  { name: 'Omar K.', score: 88, width: '88%', delay: 0.6 },
] as const

export function LandingHeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[520px]"
    >
      <div className="absolute -inset-6 rounded-3xl bg-primary/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-black/[0.04]">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <SkillSwapMark size={14} showHub={false} />
            SkillSwap
          </span>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Graduation project
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              Smart campus marketplace
            </h3>
            <div className="mt-4 flex gap-2">
              {['React', 'Python'].map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm font-medium text-foreground">AI teammate recommendations</p>
          </div>

          <ul className="space-y-3">
            {recommendations.map((person) => (
              <motion.li
                key={person.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: person.delay, duration: 0.4 }}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-background px-4 py-3.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {person.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{person.name}</span>
                    <span className="text-xs font-semibold text-primary">{person.score}%</span>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: person.width }}
                      transition={{ delay: person.delay + 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
