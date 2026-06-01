import { Link } from 'react-router-dom'
import { cn } from '@/components/ui/utils'
import skillswapMark from '@/assets/branding/skillswap-mark.svg'
import skillswapMarkOnDark from '@/assets/branding/skillswap-mark-on-dark.svg'
import {
  BRAND_LOGO_GAP_CLASS,
  BRAND_LOGO_GAP_CSS,
  BRAND_LOGO_SIZE_PX,
  type BrandLogoSize,
} from './brandLogoTokens'
import './brand-logo.css'

export type { BrandLogoSize } from './brandLogoTokens'

export type BrandLogoProps = {
  size?: BrandLogoSize
  /** `full` = icon + SkillSwap text; `mark` = icon only */
  variant?: 'full' | 'mark'
  /** @deprecated Prefer `variant="mark"` */
  showWordmark?: boolean
  to?: string
  className?: string
  wordmarkClassName?: string
  /** Optional line under the lockup (e.g. workspace label). */
  subtitle?: string
  subtitleClassName?: string
  /** Light wordmark on dark backgrounds (auth marketing panel). */
  onDark?: boolean
}

function BrandWordmark({
  className,
  onDark,
}: {
  className?: string
  onDark?: boolean
}) {
  return (
    <span
      className={cn(
        'brand-logo__wordmark',
        onDark && 'brand-logo__wordmark--on-dark',
        className
      )}
    >
      <span className="brand-logo__skill">Skill</span>
      <span className="brand-logo__swap">Swap</span>
    </span>
  )
}

function wordmarkSizeClass(size: BrandLogoSize): string | undefined {
  switch (size) {
    case 'xs':
      return 'text-sm'
    case 'sm':
      return 'text-base'
    case 'md':
    case 'lg':
      return 'text-lg'
    case 'xl':
      return 'text-xl'
    default:
      return undefined
  }
}

export function BrandLogo({
  size = 'md',
  variant,
  showWordmark,
  to,
  className,
  wordmarkClassName,
  subtitle,
  subtitleClassName,
  onDark = false,
}: BrandLogoProps) {
  const px = BRAND_LOGO_SIZE_PX[size]
  const displayWordmark =
    variant === 'mark' ? false : variant === 'full' ? true : showWordmark !== false
  const markSrc = onDark ? skillswapMarkOnDark : skillswapMark

  const content = (
    <>
      <img
        src={markSrc}
        alt=""
        width={px}
        height={px}
        className="brand-logo__mark shrink-0 select-none"
        style={{ width: px, height: px }}
        draggable={false}
      />
      {displayWordmark ? (
        <BrandWordmark
          className={cn(wordmarkSizeClass(size), wordmarkClassName)}
          onDark={onDark}
        />
      ) : null}
    </>
  )

  const lockupClass = cn(
    'inline-flex items-center',
    BRAND_LOGO_GAP_CLASS,
    'no-underline',
    !subtitle && className
  )

  const lockup =
    to !== undefined ? (
      <Link to={to} className={lockupClass} aria-label="SkillSwap home">
        {content}
      </Link>
    ) : (
      <span className={lockupClass} role="img" aria-label="SkillSwap">
        {content}
      </span>
    )

  if (!subtitle) {
    return lockup
  }

  return (
    <div className={cn('min-w-0', className)}>
      {lockup}
      <p
        className={cn(
          'mt-1 text-[11px] font-medium leading-tight text-muted-foreground truncate',
          `ml-[calc(${px}px+${BRAND_LOGO_GAP_CSS})]`,
          subtitleClassName
        )}
      >
        {subtitle}
      </p>
    </div>
  )
}

/** Icon-only mark for compact nav slots and empty states. */
export function BrandLogoMark({
  size = 'md',
  className,
  to,
  onDark,
}: {
  size?: BrandLogoSize
  className?: string
  to?: string
  onDark?: boolean
}) {
  return (
    <BrandLogo
      size={size}
      variant="mark"
      className={className}
      to={to}
      onDark={onDark}
    />
  )
}
