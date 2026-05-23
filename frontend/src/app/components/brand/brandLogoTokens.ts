/** Official SkillSwap brand colors for the logo mark and wordmark. */
export const BRAND_LOGO = {
  markFill: '#7C3AED',
  markGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 52%, #a855f7 100%)',
} as const

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const BRAND_LOGO_SIZE_PX: Record<BrandLogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
}
