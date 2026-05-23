import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { cn } from '@/components/ui/utils'

type RoleCardProps = {
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  selected: boolean
  onSelect: () => void
}

export function RoleCard({
  icon: Icon,
  title,
  description,
  badge,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'auth-role-card group relative flex w-full flex-col rounded-2xl border-2 bg-card text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
        selected
          ? 'border-primary shadow-glow auth-role-card-selected'
          : 'border-border/80 shadow-card hover:border-primary/35'
      )}
    >
      <span
        className={cn(
          'absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
        )}
        aria-hidden
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </span>

      <span
        className={cn(
          'mt-5 ml-5 grid h-12 w-12 place-items-center rounded-xl',
          selected ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <span className="text-base font-bold text-foreground">{title}</span>
          {badge ? (
            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {badge}
            </span>
          ) : null}
        </div>

        <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>

        <span
          className={cn(
            'mt-4 text-sm font-semibold transition-colors',
            selected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
          )}
        >
          {selected ? 'Selected →' : 'Choose this →'}
        </span>
      </div>
    </button>
  )
}
