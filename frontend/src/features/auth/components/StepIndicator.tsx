import { cn } from '@/shared/lib/cn'

interface StepIndicatorProps {
  steps: string[]
  current: number
  compact?: boolean
  /** When false, only the progress track is shown (avoids competing with page titles). */
  showLabel?: boolean
}

export function StepIndicator({
  steps,
  current,
  compact,
  showLabel = false,
}: StepIndicatorProps) {
  return (
    <div className={compact ? 'mb-5' : 'mb-8'}>
      <div
        className="flex items-center gap-1.5 sm:gap-2"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
      >
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-semibold transition-colors',
                compact ? 'h-6 w-6 text-[11px]' : 'h-7 w-7 text-xs',
                i <= current
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
              aria-hidden
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors',
                  i < current ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
      {showLabel && (
        <p
          className={cn(
            'font-medium text-foreground',
            compact ? 'mt-1.5 text-xs' : 'mt-3 text-sm',
          )}
        >
          {steps[current]}
        </p>
      )}
    </div>
  )
}
