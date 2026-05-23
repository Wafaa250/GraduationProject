import { cn } from '../ui/utils'
import type { RegistrationStep } from './types'

type Props = {
  steps: RegistrationStep[]
  current: number
  onJump?: (index: number) => void
  variant?: 'horizontal' | 'vertical'
}

export function ProgressStepper({ steps, current, onJump, variant = 'horizontal' }: Props) {
  if (variant === 'vertical') {
    return (
      <ol className="space-y-1">
        {steps.map((s, i) => {
          const done = i < current
          const active = i === current
          const clickable = onJump && (done || active)
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump(i)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition',
                  active && 'bg-white/12',
                  clickable && !active && 'hover:bg-white/8',
                  !clickable && 'cursor-default opacity-70'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold',
                    active || done
                      ? 'bg-white text-primary'
                      : 'border border-white/35 text-white/80'
                  )}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      active ? 'text-white' : 'text-white/85'
                    )}
                  >
                    {s.label}
                  </span>
                  {s.hint ? (
                    <span className="block text-xs text-white/65 mt-0.5">{s.hint}</span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!onJump || i > current}
            onClick={() => onJump && i <= current && onJump(i)}
            className={cn(
              'flex items-center gap-2 rounded-full px-2 py-1',
              i === current && 'bg-primary/10'
            )}
          >
            <span
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold',
                i <= current ? 'bg-gradient-brand text-primary-foreground' : 'border border-border text-muted-foreground'
              )}
            >
              {i < current ? '✓' : i + 1}
            </span>
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">{s.label}</span>
          </button>
          {i < steps.length - 1 ? <span className="h-px w-6 bg-border shrink-0" /> : null}
        </div>
      ))}
    </div>
  )
}
