import { BrandLogo } from '@/components/brand/BrandLogo'
import { LandingSectionLink } from '@/components/landing/LandingSectionLink'
import { LANDING_SECTIONS } from '@/lib/landingNav'
import { cn } from '@/components/ui/utils'

type LandingBrandLogoProps = {
  className?: string
  subtitle?: string
  subtitleClassName?: string
}

/** Landing / marketing lockup — scrolls to hero on the landing page. */
export function LandingBrandLogo({
  className = '',
  subtitle,
  subtitleClassName,
}: LandingBrandLogoProps) {
  return (
    <LandingSectionLink
      section={LANDING_SECTIONS.home}
      className={cn('inline-flex no-underline', className)}
    >
      <BrandLogo
        size="md"
        variant="full"
        wordmarkClassName="text-xl"
        subtitle={subtitle}
        subtitleClassName={subtitleClassName}
      />
    </LandingSectionLink>
  )
}
