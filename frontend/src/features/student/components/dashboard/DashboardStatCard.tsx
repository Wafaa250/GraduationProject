import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { statCardClass } from '@/shared/styles/appShell'

interface DashboardStatCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  accent?: 'primary' | 'violet' | 'emerald' | 'amber'
}

const accentMap = {
  primary: 'from-primary/15 to-primary/5 text-primary',
  violet: 'from-glow/20 to-glow/5 text-[hsl(262_70%_48%)]',
  emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600',
  amber: 'from-amber-500/15 to-amber-500/5 text-amber-600',
}

export function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'primary',
}: DashboardStatCardProps) {
  return (
    <div className={statCardClass}>
      <div
        className={cn(
          'mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-gradient-to-br',
          accentMap[accent],
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
