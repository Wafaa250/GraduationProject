import { SkillSwapLogo, type SkillSwapLogoProps } from './SkillSwapLogo'

/**
 * Canonical logo for all surfaces (marketing, auth, app shells).
 * Uses sparkles mark to match primary CTAs on the landing page.
 */
export function AppLogo(props: Omit<SkillSwapLogoProps, 'markIcon'>) {
  return <SkillSwapLogo markIcon="sparkles" {...props} />
}
