import type { CSSProperties } from 'react'
import { BadgeCheck } from 'lucide-react'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import { assocDash } from '../../pages/association/dashboard/associationDashTokens'

export function getAssociationInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'SA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const AVATAR_SIZES: Record<AvatarSize, number> = {
  sm: 44,
  md: 72,
  lg: 96,
  xl: 120,
}

type AssociationAvatarProps = {
  name: string
  logoUrl?: string | null
  size?: AvatarSize
  style?: CSSProperties
}

export function AssociationAvatar({ name, logoUrl, size = 'md', style }: AssociationAvatarProps) {
  const px = AVATAR_SIZES[size]
  const src = logoUrl ? resolveApiFileUrl(logoUrl) ?? logoUrl : null
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 22 : size === 'lg' ? 28 : 34

  const box: CSSProperties = {
    width: px,
    height: px,
    borderRadius: size === 'xl' ? 20 : size === 'lg' ? 18 : 14,
    border: `2px solid ${assocDash.accentBorder}`,
    background: assocDash.accentMuted,
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
    ...style,
  }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{ ...box, objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      style={{
        ...box,
        fontFamily: assocDash.fontDisplay,
        fontWeight: 800,
        fontSize,
        color: assocDash.accentDark,
        letterSpacing: '-0.02em',
      }}
      aria-hidden
    >
      {getAssociationInitials(name)}
    </div>
  )
}

export function VerifiedBadge({ style }: { style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: '#ecfdf5',
        color: '#047857',
        border: '1px solid #a7f3d0',
        ...style,
      }}
    >
      <BadgeCheck size={15} strokeWidth={2.5} aria-hidden />
      Verified Organization
    </span>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        background: assocDash.accentMuted,
        color: assocDash.accentDark,
        border: `1px solid ${assocDash.accentBorder}`,
      }}
    >
      {category}
    </span>
  )
}

