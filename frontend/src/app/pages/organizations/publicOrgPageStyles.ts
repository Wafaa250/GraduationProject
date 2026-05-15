import type { CSSProperties } from 'react'
import { assocDash } from '../association/dashboard/associationDashTokens'

export const publicOrgPage = {
  page: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${assocDash.bg} 0%, #f1f5f9 100%)`,
    fontFamily: assocDash.font,
    color: assocDash.text,
  } satisfies CSSProperties,
  nav: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 30,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${assocDash.border}`,
  } satisfies CSSProperties,
  navInner: {
    maxWidth: 1080,
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } satisfies CSSProperties,
  content: {
    maxWidth: 1080,
    margin: '0 auto',
    padding: '28px 20px 48px',
  } satisfies CSSProperties,
  card: {
    borderRadius: assocDash.radiusLg,
    border: `1px solid ${assocDash.border}`,
    background: '#fff',
    boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
  } satisfies CSSProperties,
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: assocDash.radiusMd,
    border: `1px solid ${assocDash.border}`,
    background: '#fff',
    color: assocDash.muted,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } satisfies CSSProperties,
  logoText: {
    fontFamily: assocDash.fontDisplay,
    fontWeight: 800,
    fontSize: 16,
    color: assocDash.text,
  } satisfies CSSProperties,
  logoAccent: { color: assocDash.accent } satisfies CSSProperties,
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: 17,
    fontWeight: 700,
    fontFamily: assocDash.fontDisplay,
    color: assocDash.text,
  } satisfies CSSProperties,
}

export function formatJoinedDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
