import { Mail, Pencil, X } from 'lucide-react'
import { AssociationAvatar, VerifiedBadge } from './associationBrand'
import { assocCard } from '@/pages/association/dashboard/associationDashTokens'
import type { StudentAssociationProfile } from '@/api/associationApi'

type Props = {
  profile: StudentAssociationProfile
  onEdit?: () => void
  editing?: boolean
  onCancel?: () => void
}

export function AssociationProfileHeader({ profile, onEdit, editing, onCancel }: Props) {
  const faculty = profile.faculty?.trim()
  const category = profile.category?.trim()
  const metaLine = [faculty, category].filter(Boolean).join(' • ')

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

      <div className="assoc-profile-header__main">
        <div className="assoc-profile-header__grid">
          <div className="assoc-profile-header__avatar-col">
            <div className="assoc-profile-header__avatar-wrap">
              <AssociationAvatar
                name={profile.associationName}
                logoUrl={profile.logoUrl}
                size="xl"
              />
            </div>
          </div>

          <div className="assoc-profile-header__info-col">
            <h1 className="assoc-profile-header__name">{profile.associationName}</h1>
            <p className="assoc-profile-header__handle">@{profile.username}</p>

            {metaLine ? (
              <p className="assoc-profile-header__meta">{metaLine}</p>
            ) : null}

            {profile.isVerified ? (
              <div className="assoc-profile-header__verified">
                <VerifiedBadge />
              </div>
            ) : null}

            {profile.email ? (
              <p className="assoc-profile-header__email">
                <Mail size={14} strokeWidth={2} aria-hidden />
                <span>{profile.email}</span>
              </p>
            ) : null}
          </div>

          <div className="assoc-profile-header__actions-col">
            {!editing && onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="assoc-profile-btn assoc-profile-btn--primary"
              >
                <Pencil size={15} strokeWidth={2.25} aria-hidden />
                Edit profile
              </button>
            ) : null}
            {editing && onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="assoc-profile-btn assoc-profile-btn--ghost"
              >
                <X size={15} strokeWidth={2.25} aria-hidden />
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
