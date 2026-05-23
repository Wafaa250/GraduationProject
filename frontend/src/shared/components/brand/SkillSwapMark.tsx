import { cn } from '@/shared/lib/cn'

export type SkillSwapMarkVariant = 'default' | 'onPrimary' | 'mono'

export interface SkillSwapMarkProps {
  size?: number
  className?: string
  variant?: SkillSwapMarkVariant
  /** Center hub — AI match point (auto-hidden below 20px) */
  showHub?: boolean
}

/**
 * SkillSwap brand mark — minimal skill graph: three nodes, three links, one hub.
 * Nodes = skills · Links = collaboration & matching · Hub = AI recommendations
 */
export function SkillSwapMark({
  size = 24,
  className,
  variant = 'default',
  showHub,
}: SkillSwapMarkProps) {
  const hub = showHub ?? size >= 20

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SkillSwap"
      className={cn(
        'shrink-0',
        variant === 'default' && 'text-primary',
        variant === 'onPrimary' && 'text-primary-foreground',
        variant === 'mono' && 'text-foreground',
        className,
      )}
    >
      <path
        d="M16 10.75 L10.35 20.25 M16 10.75 L21.65 20.25 M12 22.25 L20 22.25"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          variant === 'default' && 'opacity-[0.32]',
          variant === 'onPrimary' && 'opacity-40',
          variant === 'mono' && 'opacity-25',
        )}
      />
      <circle cx="16" cy="9" r="4" fill="currentColor" />
      <circle cx="9" cy="22" r="4" fill="currentColor" />
      <circle cx="23" cy="22" r="4" fill="currentColor" />
      {hub && (
        <circle
          cx="16"
          cy="16.25"
          r="2.25"
          fill="currentColor"
          className={cn(variant === 'onPrimary' && 'opacity-90')}
        />
      )}
    </svg>
  )
}
