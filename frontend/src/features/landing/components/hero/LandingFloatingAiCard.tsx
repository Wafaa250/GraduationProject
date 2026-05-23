import { motion } from 'framer-motion'
import { Sparkles, UserRound } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface FloatingAiCardProps {
  className?: string
  animationClass?: string
  delay?: number
  variant: 'teammate' | 'supervisor'
}

const variants = {
  teammate: {
    icon: Sparkles,
    label: 'Top match',
    title: 'Sara M.',
    score: '94%',
  },
  supervisor: {
    icon: UserRound,
    label: 'Supervisor',
    title: 'Dr. Nasser',
    score: '91%',
  },
} as const

export function LandingFloatingAiCard({
  className,
  animationClass = 'animate-float',
  delay = 0,
  variant,
}: FloatingAiCardProps) {
  const config = variants[variant]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn('absolute z-20 w-[180px]', animationClass, className)}
    >
      <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-lg shadow-black/[0.06] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">{config.label}</p>
              <p className="text-sm font-semibold text-foreground">{config.title}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-primary">{config.score}</span>
        </div>
      </div>
    </motion.div>
  )
}
