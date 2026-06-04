import type { CSSProperties } from 'react'

export const assocDash = {
  font: 'DM Sans, ui-sans-serif, system-ui, sans-serif',
  fontDisplay: 'Syne, ui-sans-serif, system-ui, sans-serif',
  bg: 'hsl(var(--aw-shell-bg))',
  surface: 'hsl(var(--aw-surface))',
  border: 'hsl(var(--aw-border))',
  text: 'hsl(var(--aw-text))',
  textSecondary: 'hsl(var(--aw-text-secondary))',
  muted: 'hsl(var(--aw-muted))',
  subtle: 'hsl(var(--aw-subtle))',
  label: 'hsl(var(--aw-label))',
  accent: 'hsl(var(--aw-accent))',
  accentDark: 'hsl(var(--aw-accent-dark))',
  accentMuted: 'hsl(var(--aw-accent-muted))',
  accentBorder: 'hsl(var(--aw-accent-border))',
  accentSoft: 'hsl(var(--aw-accent-soft))',
  accentInk: 'hsl(var(--aw-accent-ink))',
  accentBar: 'hsl(var(--aw-accent-bar))',
  navActive: 'hsl(var(--aw-nav-active))',
  white: '#fff',
  overlay: 'hsl(var(--aw-overlay) / 0.42)',
  success: 'hsl(var(--aw-success))',
  successMuted: 'hsl(var(--aw-success-muted))',
  successBorder: 'hsl(var(--aw-success-border))',
  error: 'hsl(var(--aw-error))',
  errorMuted: 'hsl(var(--aw-error-muted))',
  errorBorder: 'hsl(var(--aw-error-border))',
  radiusLg: 16,
  radiusMd: 12,
  shadow: 'var(--aw-shadow)',
  shadowLg: 'var(--aw-shadow-lg)',
  shadowHover: 'var(--aw-shadow-hover)',
  gradient: 'var(--aw-gradient)',
  gradientCard: 'var(--aw-gradient-card)',
  gradientCover: 'var(--aw-gradient-cover)',
  gradientSurface: 'var(--aw-gradient-surface)',
  focusShadow: '0 0 0 3px hsl(var(--aw-accent) / 0.14)',
} as const

/** Status chips — one palette everywhere */
export const assocSemantic = {
  success: {
    bg: assocDash.successMuted,
    color: assocDash.success,
    border: assocDash.successBorder,
  },
  error: {
    bg: assocDash.errorMuted,
    color: assocDash.error,
    border: assocDash.errorBorder,
  },
  warning: {
    bg: assocDash.accentMuted,
    color: assocDash.accentDark,
    border: assocDash.accentBorder,
  },
  neutral: {
    bg: assocDash.bg,
    color: assocDash.muted,
    border: assocDash.border,
  },
} as const

/** Typography scale for association dashboard pages. */
export const assocType = {
  pageTitle: {
    fontFamily: assocDash.fontDisplay,
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
    color: assocDash.text,
  },
  sectionTitle: {
    fontFamily: assocDash.fontDisplay,
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    color: assocDash.text,
  },
  sectionDesc: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.5,
    color: assocDash.muted,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: assocDash.accent,
  },
  body: {
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.65,
    color: assocDash.textSecondary,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.55,
    color: assocDash.textSecondary,
  },
  meta: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.45,
    color: assocDash.muted,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: assocDash.label,
  },
  value: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.55,
    color: assocDash.text,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.35,
    color: assocDash.text,
  },
  actionDesc: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.5,
    color: assocDash.muted,
  },
  link: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
    color: assocDash.accentDark,
  },
} satisfies Record<string, CSSProperties>

/** Shared height so sidebar brand row and main topbar borders align. */
export const ASSOC_SHELL_HEADER_HEIGHT = 76

export const assocShellHeader: CSSProperties = {
  height: ASSOC_SHELL_HEADER_HEIGHT,
  minHeight: ASSOC_SHELL_HEADER_HEIGHT,
  maxHeight: ASSOC_SHELL_HEADER_HEIGHT,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  background: assocDash.surface,
  borderBottom: `1px solid ${assocDash.border}`,
}

export const assocCard: CSSProperties = {
  background: assocDash.surface,
  borderRadius: assocDash.radiusLg,
  border: `1px solid ${assocDash.border}`,
  boxShadow: assocDash.shadow,
}

/** Narrower content width for settings / profile forms. */
export const ASSOC_PROFILE_MAX_WIDTH = 720
