import { cn } from '@/shared/lib/cn'

/** Vertical spacing between label, control, and helper text */
export const fieldGroupClass = 'space-y-1.5'

export const fieldLabelClass = 'block text-sm font-medium text-foreground'

export const fieldHintClass = 'text-xs text-muted-foreground'

export const fieldErrorClass = 'text-xs font-medium text-red-600'

/** Text inputs, native selects, combobox triggers — h-10 matches Button `md` */
export function controlInputClass(options?: { error?: boolean; className?: string }) {
  const { error, className } = options ?? {}
  return cn(
    'flex h-10 w-full rounded-lg border bg-card px-3 text-sm text-foreground',
    'placeholder:text-muted-foreground/70',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-55',
    error
      ? 'border-red-400 focus:ring-red-400/30'
      : 'border-border hover:border-primary/30',
    className,
  )
}

export function controlTextareaClass(options?: { error?: boolean; className?: string }) {
  const { error, className } = options ?? {}
  return cn(
    'w-full min-h-[5rem] resize-y rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground',
    'placeholder:text-muted-foreground/70',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-55',
    error
      ? 'border-red-400 focus:ring-red-400/30'
      : 'border-border hover:border-primary/30',
    className,
  )
}

/** Inline search inside dropdown panels */
export function controlSearchInputClass(className?: string) {
  return cn(
    'h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-sm text-foreground',
    'placeholder:text-muted-foreground/70',
    'focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
    className,
  )
}
