import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/constants/routes'
import { BrandSparklesIcon } from './BrandSparklesIcon'
import { SkillSwapMark, type SkillSwapMarkVariant } from './SkillSwapMark'

export interface SkillSwapLogoProps {
  className?: string
  /** Link to home — omit for static display */
  href?: string
  showWordmark?: boolean
  markSize?: number
  variant?: SkillSwapMarkVariant
  /** `sparkles` matches the Get started button icon */
  markIcon?: 'brand' | 'sparkles'
}

export function SkillSwapLogo({
  className,
  href = ROUTES.home,
  showWordmark = true,
  markSize = 20,
  variant = 'default',
  markIcon = 'sparkles',
}: SkillSwapLogoProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-[10px] transition-transform duration-200',
          variant === 'onPrimary'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-primary text-primary-foreground shadow-sm shadow-primary/20',
          href && 'group-hover:scale-[1.03]',
        )}
      >
        {markIcon === 'sparkles' ? (
          <BrandSparklesIcon />
        ) : (
          <SkillSwapMark size={markSize} variant="onPrimary" showHub={markSize >= 18} />
        )}
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          SkillSwap
        </span>
      )}
    </>
  )

  const rootClass = cn('group inline-flex items-center gap-2.5', className)

  if (href) {
    return (
      <Link to={href} className={rootClass}>
        {content}
      </Link>
    )
  }

  return <div className={rootClass}>{content}</div>
}
