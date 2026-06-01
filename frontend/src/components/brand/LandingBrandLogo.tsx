import { BrandLogo } from '@/components/brand/BrandLogo'
import { ROUTES } from '@/routes/paths'

type LandingBrandLogoProps = {
  className?: string
  subtitle?: string
  subtitleClassName?: string
  to?: string
}

/** Landing / marketing lockup — same mark + wordmark as app chrome. */
export function LandingBrandLogo({
  className = '',
  subtitle,
  subtitleClassName,
  to = ROUTES.home,
}: LandingBrandLogoProps) {
  return (
    <BrandLogo
      size="md"
      to={to}
      className={className}
      subtitle={subtitle}
      subtitleClassName={subtitleClassName}
      wordmarkClassName="text-xl"
    />
  )
}
