import { controlInputClass } from '@/shared/styles/formControls'
import { cn } from '@/shared/lib/cn'

export type ChoiceChipSize = 'md' | 'sm'

export const choiceChipSizeClasses: Record<ChoiceChipSize, string> = {
  md: 'px-3 py-1.5 text-sm',
  sm: 'px-2.5 py-1 text-[13px]',
}

export function choiceChipClassName(selected: boolean, size: ChoiceChipSize = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    choiceChipSizeClasses[size],
    selected
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-muted text-foreground/90 hover:bg-muted/80 hover:text-foreground',
  )
}

export const choiceChipAddTriggerClassName = (size: ChoiceChipSize = 'md') =>
  cn(
    'inline-flex items-center gap-1.5 rounded-lg font-medium text-muted-foreground transition-colors',
    'hover:bg-muted hover:text-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    choiceChipSizeClasses[size],
  )

export const choiceChipAddInputClassName = (size: ChoiceChipSize = 'md') =>
  cn(
    controlInputClass(),
    'inline-flex w-auto min-w-[8.5rem]',
    size === 'sm' && 'h-9 text-[13px]',
  )
