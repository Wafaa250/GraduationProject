import type { CSSProperties } from 'react'

export const assocDash = {
  font: 'DM Sans, ui-sans-serif, system-ui, sans-serif',
  fontDisplay: 'Syne, ui-sans-serif, system-ui, sans-serif',
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  subtle: '#94a3b8',
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

export const assocCard: CSSProperties = {
  background: assocDash.surface,
  borderRadius: assocDash.radiusLg,
  border: `1px solid ${assocDash.border}`,
  boxShadow: assocDash.shadow,
}
