/** SkillSwap orb brand — assets/branding/BRAND_GUIDELINES.md */
export const BRAND_PALETTE = {
  primaryPurple: '#7B61B8',
  indigo: '#6366F1',
  softViolet: '#A487C8',
  matchOrange: '#F59E0B',
  darkNavy: '#0F172A',
  background: {
    white: '#FFFFFF',
    soft: '#F8FAFC',
  },
  wordmark: {
    skill: '#0F172A',
    swapGradient: 'linear-gradient(135deg, #7B61B8 0%, #6366F1 100%)',
    skillOnDark: '#F8FAFC',
    swapGradientOnDark: 'linear-gradient(135deg, #C4B5FD 0%, #818CF8 100%)',
  },
} as const

export const BRAND_LOGO = {
  orbCore:
    'radial-gradient(circle at 38% 32%, #818CF8 0%, #6366F1 38%, #7B61B8 72%, #5B4D8A 100%)',
} as const

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** Icon display sizes — ~2× visual prominence vs. padded tile mark */
export const BRAND_LOGO_SIZE_PX: Record<BrandLogoSize, number> = {
  xs: 36,
  sm: 44,
  md: 56,
  lg: 64,
  xl: 72,
}

/** Gap between mark and wordmark (Tailwind spacing scale) */
export const BRAND_LOGO_GAP_CLASS = 'gap-1.5'

/** Matches BRAND_LOGO_GAP_CLASS for subtitle / layout calc */
export const BRAND_LOGO_GAP_CSS = '0.375rem'

/** Recommended presets — use `BrandLogo` / `LandingBrandLogo` everywhere */
export const BRAND_LOGO_PRESETS = {
  landing: { size: 'md' as const, wordmarkClassName: 'text-xl' },
  sidebar: { size: 'sm' as const },
  authShell: { size: 'md' as const },
  authMobile: { size: 'sm' as const },
  authHero: { size: 'lg' as const, onDark: true },
} as const
