import type { CSSProperties } from 'react'
import { assocDash } from '../association/dashboard/associationDashTokens'

export const feed = {
  header: {
    marginTop: 8,
    marginBottom: 22,
  } satisfies CSSProperties,
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    fontFamily: assocDash.fontDisplay,
    color: assocDash.text,
    letterSpacing: '-0.03em',
  } satisfies CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    fontSize: 15,
    lineHeight: 1.55,
    color: assocDash.muted,
    maxWidth: 520,
  } satisfies CSSProperties,
  section: {
    marginBottom: 36,
  } satisfies CSSProperties,
  horizontalCard: {
    flex: '0 0 300px',
    scrollSnapAlign: 'start',
  } satisfies CSSProperties,
  compactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  } satisfies CSSProperties,
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  } satisfies CSSProperties,
  skeletonPulse: {
    background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
    backgroundSize: '200% 100%',
    animation: 'feed-skeleton-shimmer 1.4s ease-in-out infinite',
    borderRadius: 8,
  } satisfies CSSProperties,
  orgCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 18,
    borderRadius: 16,
    border: `1px solid ${assocDash.border}`,
    background: '#fff',
    boxShadow: '0 4px 20px rgba(15,23,42,0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  } satisfies CSSProperties,
  eventCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRadius: 16,
    border: `1px solid ${assocDash.border}`,
    background: '#fff',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(15,23,42,0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  } satisfies CSSProperties,
  eventCover: (image?: string | null): CSSProperties => ({
    height: 120,
    background: image
      ? `center/cover no-repeat url(${image})`
      : `linear-gradient(135deg, ${assocDash.accentMuted} 0%, #f8fafc 100%)`,
    borderBottom: `1px solid ${assocDash.border}`,
  }),
  recruitmentCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    border: `1px solid ${assocDash.border}`,
    background: '#fff',
    boxShadow: '0 3px 16px rgba(15,23,42,0.04)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  } satisfies CSSProperties,
  activityCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 14,
    border: `1px solid ${assocDash.border}`,
    background: '#fff',
    boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  } satisfies CSSProperties,
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    border: 'none',
    background: assocDash.accent,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'none',
  } satisfies CSSProperties,
  ghostBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    border: `1px solid ${assocDash.accentBorder}`,
    background: assocDash.accentMuted,
    color: assocDash.accentDark,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'none',
  } satisfies CSSProperties,
  tag: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    background: '#f1f5f9',
    color: '#475569',
  } satisfies CSSProperties,
}

export const feedPageStyles = `
  @keyframes feed-skeleton-shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
  @keyframes org-hub-spin { to { transform: rotate(360deg); } }
  .org-hub-spin { animation: org-hub-spin 0.8s linear infinite; }
  .feed-org-card:hover,
  .feed-event-card:hover,
  .feed-recruitment-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(15,23,42,0.1);
    border-color: #fde68a;
  }
  .feed-activity-card:hover {
    border-color: #fde68a;
    box-shadow: 0 6px 20px rgba(15,23,42,0.08);
  }
`
