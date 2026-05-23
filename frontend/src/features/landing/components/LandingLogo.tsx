import { AppLogo, type SkillSwapLogoProps } from '@/shared/components/brand'

type LandingLogoProps = Pick<SkillSwapLogoProps, 'className' | 'href' | 'showWordmark'>

/** @deprecated Use AppLogo directly — kept for landing imports */
export function LandingLogo(props: LandingLogoProps) {
  return <AppLogo {...props} />
}
