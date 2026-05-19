import type { CSSProperties } from 'react'

export const coDash = {
  font: 'DM Sans, ui-sans-serif, system-ui, sans-serif',
  fontDisplay: 'Syne, ui-sans-serif, system-ui, sans-serif',
  bg: '#f0fdf4',
  surface: '#ffffff',
  border: '#d1fae5',
  text: '#0f172a',
  muted: '#64748b',
  subtle: '#94a3b8',
  accent: '#059669',
  accentDark: '#047857',
  accentMuted: '#ecfdf5',
  accentBorder: '#a7f3d0',
  ai: '#6366f1',
  aiMuted: '#eef2ff',
  radiusLg: 16,
  radiusMd: 12,
  shadow: '0 1px 2px rgba(5,150,105,0.04), 0 4px 16px rgba(5,150,105,0.08)',
  shadowLg: '0 12px 40px rgba(5,150,105,0.12)',
  gradient: 'linear-gradient(135deg,#10b981,#059669)',
  aiGradient: 'linear-gradient(135deg,#6366f1,#9333ea)',
} as const

export const coCard: CSSProperties = {
  background: coDash.surface,
  borderRadius: coDash.radiusLg,
  border: `1px solid ${coDash.border}`,
  boxShadow: coDash.shadow,
}
