import { Mail, Pencil, X } from 'lucide-react'
import { AssociationAvatar, CategoryBadge, VerifiedBadge } from './associationBrand'
import { assocCard, assocDash } from '@/pages/association/dashboard/associationDashTokens'
import type { StudentAssociationProfile } from '@/api/associationApi'

type Props = {
  profile: StudentAssociationProfile
  onEdit?: () => void
  editing?: boolean
  onCancel?: () => void
}

export function AssociationProfileHeader({ profile, onEdit, editing, onCancel }: Props) {
  return (
    <section
      className="assoc-profile-header"
      style={{
        ...assocCard,
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <div className="assoc-profile-header__cover" aria-hidden />
      <div className="assoc-profile-header__body">
        <div className="assoc-profile-header__row">
          <div className="assoc-profile-header__identity">
            <AssociationAvatar
              name={profile.associationName}
              logoUrl={profile.logoUrl}
              size="xl"
              style={{
                boxShadow: '0 10px 28px rgba(15,23,42,0.12), 0 0 0 3px #fff',
                border: 'none',
              }}
            />
            <div className="assoc-profile-header__info">
              <h1 style={{ fontFamily: assocDash.fontDisplay, color: assocDash.text }}>
                {profile.associationName}
              </h1>
              <p className="assoc-profile-header__handle">@{profile.username}</p>
              {profile.faculty && <p className="assoc-profile-header__faculty">{profile.faculty}</p>}
              <div className="assoc-profile-header__badges">
                {profile.category && <CategoryBadge category={profile.category} />}
                {profile.isVerified && <VerifiedBadge />}
              </div>
            </div>
          </div>
          <div className="assoc-profile-header__actions">
            {!editing && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="assoc-profile-btn assoc-profile-btn--primary"
              >
                <Pencil size={15} strokeWidth={2.25} aria-hidden />
                Edit profile
              </button>
            )}
            {editing && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="assoc-profile-btn assoc-profile-btn--ghost"
              >
                <X size={15} strokeWidth={2.25} aria-hidden />
                Cancel
              </button>
            )}
          </div>
        </div>
        {profile.email && (
          <p className="assoc-profile-email">
            <Mail size={14} strokeWidth={2} aria-hidden />
            {profile.email}
          </p>
        )}
      </div>
    </section>
  )
}
