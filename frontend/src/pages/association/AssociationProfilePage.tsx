import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link2, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AssociationLogoUpload } from '@/components/association/AssociationLogoUpload'
import { ROUTES } from '@/routes/paths'
import { AssociationProfileHeader } from '@/components/association/AssociationProfileHeader'
import { SocialLinksList } from '@/components/association/SocialLinksList'
import {
  ASSOCIATION_CATEGORIES,
  getAssociationProfile,
  parseApiErrorMessage,
  updateAssociationProfile,
  uploadAssociationLogo,
  type StudentAssociationProfile,
} from '@/api/associationApi'
import { AssociationDashboardLayout } from './dashboard/AssociationDashboardLayout'
import {
  ASSOC_PROFILE_MAX_WIDTH,
  assocCard,
  assocType,
} from './dashboard/associationDashTokens'
import '@/styles/association-profile.css'

type FormState = {
  associationName: string
  username: string
  description: string
  faculty: string
  category: string
  logoUrl: string
  instagramUrl: string
  facebookUrl: string
  linkedInUrl: string
}

export default function AssociationProfilePage() {
  const [profile, setProfile] = useState<StudentAssociationProfile | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAssociationProfile()
        if (!cancelled) {
          setProfile(data)
          setForm(mapProfileToForm(data))
        }
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    window.location.href = ROUTES.login
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      const updated = await updateAssociationProfile({
        associationName: form.associationName.trim(),
        username: form.username.trim(),
        description: form.description,
        faculty: form.faculty.trim(),
        category: form.category,
        logoUrl: form.logoUrl.trim() || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        linkedInUrl: form.linkedInUrl.trim() || undefined,
      })
      setProfile(updated)
      setForm(mapProfileToForm(updated))
      localStorage.setItem('name', updated.associationName)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    if (profile) setForm(mapProfileToForm(profile))
    setEditing(false)
  }

  const name = profile?.associationName ?? localStorage.getItem('name') ?? 'Organization'
  const sidebarProfile = profile
    ? { associationName: profile.associationName, logoUrl: profile.logoUrl }
    : { associationName: name, logoUrl: null }

  const hasSocial =
    !!profile?.instagramUrl?.trim() ||
    !!profile?.facebookUrl?.trim() ||
    !!profile?.linkedInUrl?.trim()

  return (
    <AssociationDashboardLayout
      associationName={name}
      sidebarProfile={sidebarProfile}
      sidebarMobileOpen={sidebarMobileOpen}
      onSidebarOpen={() => setSidebarMobileOpen(true)}
      onSidebarClose={() => setSidebarMobileOpen(false)}
      onLogout={handleLogout}
    >
      <div className="assoc-profile-page" style={{ maxWidth: ASSOC_PROFILE_MAX_WIDTH, margin: '0 auto' }}>
        <header className="assoc-profile-page__intro">
          <p style={{ ...assocType.eyebrow, margin: 0 }}>Organization Profile</p>
          <h1 style={{ ...assocType.pageTitle, fontSize: 21 }}>Organization profile</h1>
          <p style={{ ...assocType.sectionDesc, margin: 0 }}>
            Update your public profile, logo, and social links.
          </p>
        </header>

        {loading || !form || !profile ? (
          <ProfileSkeleton />
        ) : (
          <>
            <AssociationProfileHeader
              profile={profile}
              editing={editing}
              onEdit={() => setEditing(true)}
              onCancel={cancelEdit}
            />

            {editing ? (
              <form onSubmit={handleSave} className="assoc-profile-form" style={assocCard}>
                <FormSection
                  title="Basic information"
                  description="Shown on your public organization page."
                >
                  <div className="assoc-profile-form__row assoc-profile-form__row--2">
                    <Field label="Organization name" required>
                      <input
                        value={form.associationName}
                        onChange={(e) => setForm({ ...form, associationName: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Username" required>
                      <input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        placeholder="ieee_an-najah"
                      />
                    </Field>
                  </div>
                  <Field label="About">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Tell students about your mission, events, and community."
                    />
                  </Field>
                  <div className="assoc-profile-form__row assoc-profile-form__row--2">
                    <Field label="Faculty" required>
                      <input
                        value={form.faculty}
                        onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Category" required>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                      >
                        <option value="">Select category</option>
                        {ASSOCIATION_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Logo" description="Optional — used on cards and listings.">
                  <AssociationLogoUpload
                    logoUrl={form.logoUrl || null}
                    onLogoUrlChange={async (url) => {
                      setForm((f) => (f ? { ...f, logoUrl: url ?? '' } : f))
                      if (url === null) {
                        try {
                          const updated = await updateAssociationProfile({ logoUrl: '' })
                          setProfile(updated)
                          toast.success('Logo removed')
                        } catch (err) {
                          toast.error(parseApiErrorMessage(err))
                        }
                      }
                    }}
                    onUpload={async (file, onProgress) => {
                      const url = await uploadAssociationLogo(file, onProgress)
                      setForm((f) => (f ? { ...f, logoUrl: url } : f))
                      setProfile((p) => (p ? { ...p, logoUrl: url } : p))
                      toast.success('Logo uploaded')
                      return url
                    }}
                    disabled={saving}
                  />
                </FormSection>

                <FormSection title="Social links" description="Optional — Instagram, Facebook, or LinkedIn.">
                  <Field label="Instagram">
                    <input
                      value={form.instagramUrl}
                      onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/yourorg"
                    />
                  </Field>
                  <Field label="Facebook">
                    <input
                      value={form.facebookUrl}
                      onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/yourorg"
                    />
                  </Field>
                  <Field label="LinkedIn">
                    <input
                      value={form.linkedInUrl}
                      onChange={(e) => setForm({ ...form, linkedInUrl: e.target.value })}
                      placeholder="https://linkedin.com/company/yourorg"
                    />
                  </Field>
                </FormSection>

                <div className="assoc-profile-form__footer">
                  <button
                    type="button"
                    className="assoc-profile-btn assoc-profile-btn--ghost"
                    disabled={saving}
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="assoc-profile-btn assoc-profile-btn--primary"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            ) : (
              <ViewProfile profile={profile} hasSocial={hasSocial} onEdit={() => setEditing(true)} />
            )}
          </>
        )}
      </div>
    </AssociationDashboardLayout>
  )
}

function ProfileSkeleton() {
  return (
    <div className="assoc-profile-skeleton" aria-busy aria-label="Loading profile">
      <div className="assoc-profile-skeleton__block" style={{ height: 200 }} />
      <div className="assoc-profile-skeleton__block" style={{ height: 128 }} />
      <div className="assoc-profile-skeleton__block" style={{ height: 96 }} />
    </div>
  )
}

function mapProfileToForm(data: StudentAssociationProfile): FormState {
  return {
    associationName: data.associationName,
    username: data.username,
    description: data.description ?? '',
    faculty: data.faculty ?? '',
    category: data.category ?? '',
    logoUrl: data.logoUrl ?? '',
    instagramUrl: data.instagramUrl ?? '',
    facebookUrl: data.facebookUrl ?? '',
    linkedInUrl: data.linkedInUrl ?? '',
  }
}

function ViewProfile({
  profile,
  hasSocial,
  onEdit,
}: {
  profile: StudentAssociationProfile
  hasSocial: boolean
  onEdit: () => void
}) {
  const about = profile.description?.trim()

  return (
    <div className="assoc-profile-view-stack">
      <section className="assoc-profile-view-card" style={assocCard}>
        <SectionHeader icon={<Share2 size={17} strokeWidth={2} />} title="About" />
        <p className={`assoc-profile-about${about ? '' : ' assoc-profile-about--empty'}`}>
          {about || 'Add a description so students understand your mission and activities.'}
        </p>
        <dl className="assoc-profile-meta-grid">
          <MetaItem label="Faculty" value={profile.faculty?.trim() || '—'} />
          <MetaItem label="Category" value={profile.category?.trim() || '—'} />
        </dl>
      </section>

      <section className="assoc-profile-view-card" style={assocCard}>
        <SectionHeader icon={<Link2 size={17} strokeWidth={2} />} title="Social links" />
        {hasSocial ? (
          <div className="assoc-profile-social-wrap">
            <SocialLinksList
              instagramUrl={profile.instagramUrl}
              facebookUrl={profile.facebookUrl}
              linkedInUrl={profile.linkedInUrl}
            />
          </div>
        ) : (
          <div className="assoc-profile-empty-social">
            <p>No social links yet.</p>
            <button type="button" className="assoc-profile-btn assoc-profile-btn--primary" onClick={onEdit}>
              Add social links
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="assoc-profile-form__section">
      <SectionHeader title={title} description={description} />
      <div className="assoc-profile-form__fields">{children}</div>
    </div>
  )
}

function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <div className="assoc-profile-section-head">
      {icon && <span className="assoc-profile-section-head__icon">{icon}</span>}
      <div>
        <h2 className="assoc-profile-section-head__title">{title}</h2>
        {description && <p className="assoc-profile-section-head__desc">{description}</p>}
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="assoc-profile-meta-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="assoc-profile-field">
      <span
        className={`assoc-profile-field__label${required ? ' assoc-profile-field__label--required' : ''}`}
      >
        {label}
        {required && <span> *</span>}
      </span>
      {children}
    </label>
  )
}
