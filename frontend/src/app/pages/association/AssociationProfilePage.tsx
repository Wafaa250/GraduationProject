import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AssociationLogoUpload } from '../../components/association/AssociationLogoUpload'
import { AssociationProfileHeader } from '../../components/association/AssociationProfileHeader'
import { SocialLinksList } from '../../components/association/SocialLinksList'
import {
  ASSOCIATION_CATEGORIES,
  getAssociationProfile,
  parseApiErrorMessage,
  updateAssociationProfile,
  uploadAssociationLogo,
  type StudentAssociationProfile,
} from '../../../api/associationApi'
import { AssociationDashboardLayout } from './dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from './dashboard/associationDashTokens'

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
  const navigate = useNavigate()
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
    localStorage.clear()
    navigate('/login')
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
      {loading || !form || !profile ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading profile…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AssociationProfileHeader
            profile={profile}
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={() => {
              setEditing(false)
              setForm(mapProfileToForm(profile))
            }}
          />

          {editing ? (
            <form onSubmit={handleSave} style={{ ...assocCard, padding: 28, display: 'grid', gap: 18 }}>
              <Field label="Organization name" required>
                <input
                  style={inputStyle}
                  value={form.associationName}
                  onChange={(e) => setForm({ ...form, associationName: e.target.value })}
                  required
                />
              </Field>
              <Field label="Username" required>
                <input
                  style={inputStyle}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </Field>
              <Field label="About">
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell students about your organization"
                />
              </Field>
              <Field label="Faculty" required>
                <input
                  style={inputStyle}
                  value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  required
                />
              </Field>
              <Field label="Category" required>
                <select
                  style={inputStyle}
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
              <AssociationLogoUpload
                logoUrl={form.logoUrl || null}
                onLogoUrlChange={async (url) => {
                  setForm((f) => ({ ...f, logoUrl: url ?? '' }))
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
                  setForm((f) => ({ ...f, logoUrl: url }))
                  setProfile((p) => (p ? { ...p, logoUrl: url } : p))
                  toast.success('Logo uploaded')
                  return url
                }}
                disabled={saving}
              />
              <SectionTitle>Social links</SectionTitle>
              <Field label="Instagram">
                <input
                  style={inputStyle}
                  value={form.instagramUrl}
                  onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </Field>
              <Field label="Facebook">
                <input
                  style={inputStyle}
                  value={form.facebookUrl}
                  onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  style={inputStyle}
                  value={form.linkedInUrl}
                  onChange={(e) => setForm({ ...form, linkedInUrl: e.target.value })}
                  placeholder="https://linkedin.com/..."
                />
              </Field>
              <button type="submit" disabled={saving} style={primaryBtn(saving)}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          ) : (
            <ViewProfile profile={profile} hasSocial={hasSocial} />
          )}
        </div>
      )}
    </AssociationDashboardLayout>
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
}: {
  profile: StudentAssociationProfile
  hasSocial: boolean
}) {
  const about = profile.description?.trim()

  return (
    <>
      <section style={{ ...assocCard, padding: 28 }}>
        <SectionTitle>About</SectionTitle>
        <p style={{ margin: 0, fontSize: 14, color: assocDash.text, lineHeight: 1.65 }}>
          {about || 'Add a description so students understand your mission and activities.'}
        </p>
      </section>

      {hasSocial && (
        <section style={{ ...assocCard, padding: 28 }}>
          <SectionTitle>Social links</SectionTitle>
          <SocialLinksList
            instagramUrl={profile.instagramUrl}
            facebookUrl={profile.facebookUrl}
            linkedInUrl={profile.linkedInUrl}
          />
        </section>
      )}
    </>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 12px',
        fontSize: 15,
        fontWeight: 700,
        fontFamily: assocDash.fontDisplay,
        color: assocDash.text,
      }}
    >
      {children}
    </h2>
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
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.text }}>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </span>
      <div style={{ height: 8 }} />
      {children}
    </label>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: `1.5px solid ${assocDash.border}`,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const primaryBtn = (disabled: boolean): CSSProperties => ({
  padding: '10px 20px',
  borderRadius: assocDash.radiusMd,
  border: 'none',
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  fontFamily: 'inherit',
})
