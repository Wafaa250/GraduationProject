/**
 * Shared spacing, radii, and content constraints for consistent mobile layouts.
 * Prefer these over magic numbers in screen StyleSheets.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  card: 24,
} as const;

/** Max width for form cards on phones; caps width on tablets when centered */
export const FORM_CARD_MAX_WIDTH = 448;

/** Wider content column for dashboards on tablets */
export const DASHBOARD_CONTENT_MAX_WIDTH = 600;

export const TABLET_MIN_WIDTH = 600;

export const COMPACT_PHONE_MAX_WIDTH = 380;
