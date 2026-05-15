import type { CSSProperties } from 'react'
import { AssociationAvatar, CategoryBadge, VerifiedBadge } from './associationBrand'
import { assocCard, assocDash } from '../../pages/association/dashboard/associationDashTokens'
import type { StudentAssociationProfile } from '../../../api/associationApi'

type Props = {
  profile: StudentAssociationProfile
  onEdit?: () => void
  editing?: boolean
  onCancel?: () => void
}

export function AssociationProfileHeader({ profile, onEdit, editing, onCancel }: Props) {
  return (
    <section
      style={{
        ...assocCard,
        overflow: 'hidden',
        padding: 0,
        marginBottom: 4,
      }}
    >
      <div
        style={{
          height: 100,
          background: assocDash.gradient,
          opacity: 0.9,
        }}
      />
      <div style={{ padding: '0 28px 28px', marginTop: -48, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end', flex: 1, minWidth: 0 }}>
            <AssociationAvatar
              name={profile.associationName}
              logoUrl={profile.logoUrl}
              size="xl"
              style={{
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                border: '3px solid #fff',
              }}
            />
            <div style={{ paddingBottom: 4, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 800,
                  fontFamily: assocDash.fontDisplay,
                  color: assocDash.text,
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
                {profile.associationName}
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: assocDash.muted }}>
                @{profile.username}
              </p>
              {profile.faculty && (
                <p style={{ margin: '4px 0 0', fontSize: 14, color: assocDash.subtle }}>{profile.faculty}</p>
              )}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 12,
                  alignItems: 'center',
                }}
              >
                {profile.category && <CategoryBadge category={profile.category} />}
                {profile.isVerified && <VerifiedBadge />}
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, paddingBottom: 4 }}>
            {!editing && onEdit && (
              <button type="button" onClick={onEdit} style={primaryBtn}>
                Edit profile
              </button>
            )}
            {editing && onCancel && (
              <button type="button" onClick={onCancel} style={outlineBtn}>
                Cancel
              </button>
            )}
          </div>
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 13, color: assocDash.muted }}>{profile.email}</p>
      </div>
    </section>
  )
}

const primaryBtn: CSSProperties = {
  padding: '10px 20px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const outlineBtn: CSSProperties = {
  padding: '10px 20px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: assocDash.surface,
  color: assocDash.muted,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

