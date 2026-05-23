import { Link } from 'react-router-dom'
import { cn } from '../ui/utils'
import skillswapMark from '../../../assets/branding/skillswap-mark.svg'
import { BRAND_LOGO_SIZE_PX, type BrandLogoSize } from './brandLogoTokens'
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
  /** Light wordmark on dark backgrounds (auth marketing panel). */
  onDark?: boolean
}

export function BrandLogo({
  size = 'md',
  variant,
  showWordmark,
  to,
  className,
  wordmarkClassName,
  onDark = false,
}: BrandLogoProps) {
  const px = BRAND_LOGO_SIZE_PX[size]
  const displayWordmark =
    variant === 'mark' ? false : variant === 'full' ? true : showWordmark !== false

  const content = (
    <>
      <img
        src={skillswapMark}
        alt=""
        width={px}
        height={px}
        className="shrink-0 select-none"
        style={{ width: px, height: px }}
        draggable={false}
      />
      {displayWordmark ? (
        <span
          className={cn(
            'font-semibold tracking-tight',
            size === 'xs' && 'text-sm',
            size === 'sm' && 'text-base',
            (size === 'md' || size === 'lg') && 'text-lg',
            size === 'xl' && 'text-xl',
            onDark ? 'brand-logo__wordmark brand-logo__wordmark--on-dark' : 'brand-logo__wordmark',
            wordmarkClassName
          )}
        >
          SkillSwap
        </span>
      ) : null}
    </>
  )

  const wrapperClass = cn('inline-flex items-center gap-2.5 no-underline', className)

  if (to) {
    return (
      <Link to={to} className={wrapperClass} aria-label="SkillSwap home">
        {content}
      </Link>
    )
  }

  return (
    <span className={wrapperClass} role="img" aria-label="SkillSwap">
      {content}
    </span>
  )
}

/** Icon-only mark for compact nav slots and empty states. */
export function BrandLogoMark({
  size = 'md',
  className,
  to,
}: {
  size?: BrandLogoSize
  className?: string
  to?: string
}) {
  return <BrandLogo size={size} variant="mark" className={className} to={to} />
}
