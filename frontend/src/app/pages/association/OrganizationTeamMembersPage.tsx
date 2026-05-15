import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import {
  createOrganizationTeamMember,
  deleteOrganizationTeamMember,
  listOrganizationTeamMembers,
  parseApiErrorMessage,
  updateOrganizationTeamMember,
  uploadOrganizationTeamMemberImage,
  type OrganizationTeamMember,
} from '../../../api/organizationTeamMembersApi'
import { TeamMemberPortraitUpload } from '../../components/association/TeamMemberPortraitUpload'
import { AssociationDashboardLayout } from './dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from './dashboard/associationDashTokens'
import { useAssociationShell } from './events/useAssociationShell'

type Draft = {
  fullName: string
  roleTitle: string
  major: string
  imageUrl: string
  linkedInUrl: string
  displayOrder: string
}

function emptyDraft(): Draft {
  return {
    fullName: '',
    roleTitle: '',
    major: '',
    imageUrl: '',
    linkedInUrl: '',
    displayOrder: '0',
  }
}

function draftFromMember(m: OrganizationTeamMember): Draft {
  return {
    fullName: m.fullName,
    roleTitle: m.roleTitle,
    major: m.major ?? '',
    imageUrl: m.imageUrl ?? '',
    linkedInUrl: m.linkedInUrl ?? '',
    displayOrder: String(m.displayOrder ?? 0),
  }
}

export default function OrganizationTeamMembersPage() {
  const shell = useAssociationShell()
  const [members, setMembers] = useState<OrganizationTeamMember[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [formExpanded, setFormExpanded] = useState(false)

  const loadMembers = async () => {
    setListLoading(true)
    try {
      const data = await listOrganizationTeamMembers()
      setMembers(data)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void loadMembers()
  }, [])

  const startCreate = () => {
    setEditingId(null)
    setDraft(emptyDraft())
    setFormExpanded(true)
  }

  const startEdit = (m: OrganizationTeamMember) => {
    setEditingId(m.id)
    setDraft(draftFromMember(m))
    setFormExpanded(true)
  }

  const cancelForm = () => {
    setEditingId(null)
    setDraft(emptyDraft())
    setFormExpanded(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const displayOrder = Number.parseInt(draft.displayOrder.trim(), 10)
    const order = Number.isFinite(displayOrder) ? displayOrder : 0

    const payload = {
      fullName: draft.fullName.trim(),
      roleTitle: draft.roleTitle.trim(),
      major: draft.major.trim() || null,
      imageUrl: draft.imageUrl.trim() || null,
      linkedInUrl: draft.linkedInUrl.trim() || null,
      displayOrder: order,
    }

    if (!payload.fullName || !payload.roleTitle) {
      toast.error('Full name and role title are required.')
      return
    }

    setSaving(true)
    try {
      if (editingId != null) {
        const updated = await updateOrganizationTeamMember(editingId, payload)
        setMembers((prev) =>
          prev.map((x) => (x.id === updated.id ? updated : x)).sort(byOrder),
        )
        toast.success('Leadership member updated')
      } else {
        const created = await createOrganizationTeamMember(payload)
        setMembers((prev) => [...prev, created].sort(byOrder))
        toast.success('Leadership member added')
      }
      cancelForm()
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (m: OrganizationTeamMember) => {
    if (
      !window.confirm(
        `Remove ${m.fullName} from the public leadership showcase? This does not affect any SkillSwap accounts.`,
      )
    )
      return
    setDeletingId(m.id)
    try {
      await deleteOrganizationTeamMember(m.id)
      setMembers((prev) => prev.filter((x) => x.id !== m.id))
      if (editingId === m.id) cancelForm()
      toast.success('Removed from leadership showcase')
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
    >
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: assocDash.accent }}>Student Organization</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 6,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                fontFamily: assocDash.fontDisplay,
                color: assocDash.text,
              }}
            >
              Leadership team
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted, maxWidth: 560, lineHeight: 1.55 }}>
              Showcase the current student leaders and coordinators behind your organization. These entries are public
              only—people listed here are not given app access or admin permissions.
            </p>
          </div>
          <button type="button" onClick={startCreate} style={{ ...createBtnStyle, border: 'none', cursor: 'pointer' }}>
            <Plus size={18} />
            Add member
          </button>
        </div>
      </header>

      {formExpanded && (
        <form
          onSubmit={handleSubmit}
          style={{ ...assocCard, padding: 28, marginBottom: 24, display: 'grid', gap: 16 }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: assocDash.fontDisplay,
            }}
          >
            {editingId != null ? 'Edit showcase entry' : 'New showcase entry'}
          </h2>
          <p style={{ margin: '-4px 0 0', fontSize: 13, color: assocDash.subtle, lineHeight: 1.5 }}>
            This information appears on your public organization profile so students can see who represents your club.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              alignItems: 'start',
            }}
          >
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.text }}>Portrait</span>
              <p style={{ margin: '6px 0 10px', fontSize: 12, color: assocDash.muted }}>
                Upload a photo or paste an image URL below.
              </p>
              <TeamMemberPortraitUpload
                imageUrl={draft.imageUrl.trim() || null}
                onImageUrlChange={(url) => setDraft((d) => ({ ...d, imageUrl: url ?? '' }))}
                onUpload={uploadOrganizationTeamMemberImage}
                disabled={saving}
              />
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Image URL" optional>
                <input
                  style={inputStyle}
                  value={draft.imageUrl}
                  onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                  placeholder="https://… or leave empty"
                />
              </Field>
              <Field label="Full name" required>
                <input
                  style={inputStyle}
                  value={draft.fullName}
                  onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Role title" required>
                <input
                  style={inputStyle}
                  value={draft.roleTitle}
                  onChange={(e) => setDraft((d) => ({ ...d, roleTitle: e.target.value }))}
                  placeholder="e.g. President, Events Coordinator"
                  required
                />
              </Field>
              <Field label="Major" optional>
                <input
                  style={inputStyle}
                  value={draft.major}
                  onChange={(e) => setDraft((d) => ({ ...d, major: e.target.value }))}
                />
              </Field>
              <Field label="LinkedIn URL" optional>
                <input
                  style={inputStyle}
                  value={draft.linkedInUrl}
                  onChange={(e) => setDraft((d) => ({ ...d, linkedInUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/…"
                />
              </Field>
              <Field label="Display order" optional>
                <input
                  style={inputStyle}
                  type="number"
                  value={draft.displayOrder}
                  onChange={(e) => setDraft((d) => ({ ...d, displayOrder: e.target.value }))}
                />
                <p style={{ margin: '6px 0 0', fontSize: 11, color: assocDash.muted }}>
                  Lower numbers appear first on your public profile.
                </p>
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="submit" disabled={saving} style={primaryBtn(saving)}>
              {saving ? 'Saving…' : editingId != null ? 'Save changes' : 'Add to showcase'}
            </button>
            <button type="button" disabled={saving} onClick={cancelForm} style={ghostBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {shell.loading || listLoading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading leadership team…</p>
      ) : members.length === 0 ? (
        <div style={{ ...assocCard, padding: 40, textAlign: 'center' }}>
          <UserRound size={40} color={assocDash.accent} style={{ marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontFamily: assocDash.fontDisplay }}>No one listed yet</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: assocDash.muted, maxWidth: 440, marginInline: 'auto' }}>
            Highlight your elected leads, coordinators, and chapter heads. This is a simple public directory—not user
            management.
          </p>
          <button type="button" onClick={startCreate} style={{ ...createBtnStyle, border: 'none', cursor: 'pointer' }}>
            <Plus size={18} />
            Add your first member
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 18,
          }}
        >
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                ...assocCard,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <PortraitThumb url={m.imageUrl} name={m.fullName} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: assocDash.text, lineHeight: 1.3 }}>
                    {m.fullName}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: assocDash.accent }}>
                    {m.roleTitle}
                  </p>
                  {m.major?.trim() && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: assocDash.muted }}>{m.major}</p>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: assocDash.subtle }}>
                    Order: {m.displayOrder}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  style={editBtnStyle}
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === m.id}
                  onClick={() => void handleDelete(m)}
                  style={deleteBtnStyle}
                >
                  <Trash2 size={14} />
                  {deletingId === m.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AssociationDashboardLayout>
  )
}

function byOrder(a: OrganizationTeamMember, b: OrganizationTeamMember) {
  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

function PortraitThumb({ url, name }: { url?: string | null; name: string }) {
  const src = url ? resolveApiFileUrl(url) : null
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${assocDash.border}`,
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: assocDash.accentMuted,
        border: `2px solid ${assocDash.accentBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: assocDash.accent,
        fontSize: 18,
        fontWeight: 800,
        flexShrink: 0,
      }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: assocDash.text }}>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
        {optional && <span style={{ fontWeight: 400, color: assocDash.muted }}> (optional)</span>}
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

const createBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: assocDash.radiusMd,
  background: assocDash.gradient,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  fontFamily: 'inherit',
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

const ghostBtn: CSSProperties = {
  padding: '10px 18px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  color: assocDash.text,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const editBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: assocDash.accentDark,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const deleteBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: '#b91c1c',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
