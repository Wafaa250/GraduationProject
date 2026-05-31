import type { CSSProperties } from 'react'

export const assocDash = {
  font: 'DM Sans, ui-sans-serif, system-ui, sans-serif',
  fontDisplay: 'Syne, ui-sans-serif, system-ui, sans-serif',
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#334155',
  muted: '#475569',
  subtle: '#64748b',
  label: '#64748b',
  accent: '#d97706',
  accentDark: '#b45309',
  accentMuted: '#fffbeb',
  accentBorder: '#fde68a',
  radiusLg: 16,
  radiusMd: 12,
  shadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
  shadowLg: '0 8px 30px rgba(15,23,42,0.08)',
  gradient: 'linear-gradient(135deg,#f59e0b,#ea580c)',
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
    color: assocDash.accentDark,
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
