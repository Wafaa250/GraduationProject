import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { ArrowLeft, ChevronDown, Loader2, Plus, Sparkles, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createOrganizationTeamMember,
  deleteOrganizationTeamMember,
  listOrganizationTeamMembers,
  parseApiErrorMessage,
  updateOrganizationTeamMember,
  uploadOrganizationTeamMemberImage,
  type OrganizationTeamMember,
} from '@/api/organizationTeamMembersApi'
import { LeadershipProfileCard } from '@/components/association/LeadershipProfileCard'
import { TeamMemberPortraitUpload } from '@/components/association/TeamMemberPortraitUpload'
import { sortByLeadershipRole } from '@/utils/leadershipRoleSort'
import { AssociationDashboardLayout } from './dashboard/AssociationDashboardLayout'
import { assocDash } from './dashboard/associationDashTokens'
import { useAssociationShell } from './events/useAssociationShell'

type Draft = {
  fullName: string
  roleTitle: string
  major: string
  imageUrl: string
  linkedInUrl: string
}

function emptyDraft(): Draft {
  return { fullName: '', roleTitle: '', major: '', imageUrl: '', linkedInUrl: '' }
}

function draftFromMember(m: OrganizationTeamMember): Draft {
  return {
    fullName: m.fullName,
    roleTitle: m.roleTitle,
    major: m.major ?? '',
    imageUrl: m.imageUrl ?? '',
    linkedInUrl: m.linkedInUrl ?? '',
  }
}

function draftsEqual(a: Draft, b: Draft): boolean {
  return (
    a.fullName === b.fullName &&
    a.roleTitle === b.roleTitle &&
    a.major === b.major &&
    a.imageUrl === b.imageUrl &&
    a.linkedInUrl === b.linkedInUrl
  )
}

export default function OrganizationTeamMembersPage() {
  const shell = useAssociationShell()
  const [members, setMembers] = useState<OrganizationTeamMember[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [baselineDraft, setBaselineDraft] = useState<Draft>(emptyDraft())
  const [formExpanded, setFormExpanded] = useState(false)
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const loadMembers = async () => {
    setListLoading(true)
    try {
      const showcase = await listOrganizationTeamMembers()
      setMembers(showcase)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void loadMembers()
  }, [])

  useEffect(() => {
    if (formExpanded) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [formExpanded])

  const isDirty = formExpanded && !draftsEqual(draft, baselineDraft)

  const startCreate = () => {
    setEditingId(null)
    const empty = emptyDraft()
    setDraft(empty)
    setBaselineDraft(empty)
    setPortraitPreviewUrl(null)
    setShowAdvanced(false)
    setFormExpanded(true)
  }

  const startEdit = (m: OrganizationTeamMember) => {
    const next = draftFromMember(m)
    setEditingId(m.id)
    setDraft(next)
    setBaselineDraft(next)
    setPortraitPreviewUrl(null)
    setShowAdvanced(!!next.imageUrl && !next.imageUrl.startsWith('/'))
    setFormExpanded(true)
  }

  const cancelForm = () => {
    setEditingId(null)
    setDraft(emptyDraft())
    setBaselineDraft(emptyDraft())
    setPortraitPreviewUrl(null)
    setShowAdvanced(false)
    setFormExpanded(false)
  }

  const tryLeaveForm = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return
    cancelForm()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      fullName: draft.fullName.trim(),
      roleTitle: draft.roleTitle.trim(),
      major: draft.major.trim() || null,
      imageUrl: draft.imageUrl.trim() || null,
      linkedInUrl: draft.linkedInUrl.trim() || null,
    }

    if (!payload.fullName || !payload.roleTitle) {
      toast.error('Full name and position are required.')
      return
    }

    setSaving(true)
    try {
      if (editingId != null) {
        const updated = await updateOrganizationTeamMember(editingId, payload)
        setMembers((prev) =>
          sortByLeadershipRole(prev.map((x) => (x.id === updated.id ? updated : x))),
        )
        toast.success('Position updated')
      } else {
        const created = await createOrganizationTeamMember(payload)
        setMembers((prev) => sortByLeadershipRole([...prev, created]))
        toast.success('Position added')
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
        `Remove ${m.fullName} (${m.roleTitle}) from the public leadership board?`,
      )
    )
      return
    setDeletingId(m.id)
    try {
      await deleteOrganizationTeamMember(m.id)
      setMembers((prev) => prev.filter((x) => x.id !== m.id))
      if (editingId === m.id) cancelForm()
      toast.success('Position removed')
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const handlePortraitPreview = useCallback((url: string | null) => {
    setPortraitPreviewUrl(url)
  }, [])

  const orgName = shell.sidebarProfile.associationName
  const sortedMembers = sortByLeadershipRole(members)
  const previewImageUrl = (portraitPreviewUrl ?? draft.imageUrl.trim()) || null

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
    >
      <div className="lt-page">
        {formExpanded ? (
          <form onSubmit={handleSubmit} className="lt-form-shell">
            <div className="lt-form-topbar">
              <button type="button" onClick={tryLeaveForm} className="lt-back-btn" disabled={saving}>
                <ArrowLeft size={16} strokeWidth={2.25} />
                Back to board
              </button>
              {isDirty && <span className="lt-unsaved-pill">Unsaved changes</span>}
            </div>

            <div className="lt-form-card">
              <header className="lt-form-card-header">
                <div className="lt-form-title-icon" aria-hidden>
                  <Sparkles size={18} strokeWidth={2} />
                </div>
                <div>
                  <h1 className="lt-form-title">
                    {editingId != null ? 'Edit position' : 'Add position'}
                  </h1>
                  <p className="lt-form-subtitle">
                    {editingId != null
                      ? 'Update this position’s public profile details.'
                      : 'Add a new position to your leadership board.'}
                  </p>
                </div>
              </header>

              <div className="lt-form-grid">
                <aside className="lt-preview-aside">
                  <p className="lt-aside-label">Live preview</p>
                  <LeadershipProfileCard
                    preview
                    fullName={draft.fullName}
                    roleTitle={draft.roleTitle}
                    major={draft.major}
                    imageUrl={previewImageUrl}
                    linkedInUrl={draft.linkedInUrl}
                    organizationName={orgName}
                  />
                  <p className="lt-aside-note">
                    Matches your public profile card — students see exactly this layout.
                  </p>
                </aside>

                <div className="lt-fields-stack">
                  <FormSection
                    title="Profile photo"
                    description="A clear portrait helps students recognize your board."
                  >
                    <TeamMemberPortraitUpload
                      variant="hero"
                      imageUrl={draft.imageUrl.trim() || null}
                      onImageUrlChange={(url) => setDraft((d) => ({ ...d, imageUrl: url ?? '' }))}
                      onDisplayUrlChange={handlePortraitPreview}
                      onUpload={uploadOrganizationTeamMemberImage}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className={`lt-advanced-toggle${showAdvanced ? ' lt-advanced-toggle--open' : ''}`}
                      onClick={() => setShowAdvanced((v) => !v)}
                      aria-expanded={showAdvanced}
                    >
                      Advanced options
                      <ChevronDown size={15} strokeWidth={2.25} />
                    </button>
                    {showAdvanced && (
                      <Field label="Image URL" optional>
                        <input
                          className="lt-input"
                          value={draft.imageUrl}
                          onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                          placeholder="https://… or /uploads/…"
                        />
                        <p className="lt-field-hint">
                          Paste a direct image URL instead of uploading. Upload is recommended.
                        </p>
                      </Field>
                    )}
                  </FormSection>

                  <FormSection title="Basic information">
                    <div className="lt-field-row">
                      <Field label="Full name" required>
                        <input
                          className="lt-input"
                          value={draft.fullName}
                          onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                          placeholder="Sarah Al-Masri"
                          required
                        />
                      </Field>
                      <Field label="Position" required>
                        <input
                          className="lt-input"
                          value={draft.roleTitle}
                          onChange={(e) => setDraft((d) => ({ ...d, roleTitle: e.target.value }))}
                          placeholder="President"
                          required
                        />
                      </Field>
                    </div>
                    <Field label="Major" optional>
                      <input
                        className="lt-input"
                        value={draft.major}
                        onChange={(e) => setDraft((d) => ({ ...d, major: e.target.value }))}
                        placeholder="Computer Engineering"
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Social links">
                    <Field label="LinkedIn URL" optional>
                      <input
                        className="lt-input"
                        value={draft.linkedInUrl}
                        onChange={(e) => setDraft((d) => ({ ...d, linkedInUrl: e.target.value }))}
                        placeholder="https://linkedin.com/in/…"
                      />
                    </Field>
                  </FormSection>
                </div>
              </div>

              <footer className="lt-form-footer">
                <button type="submit" disabled={saving} className="lt-btn-primary">
                  {saving ? (
                    <>
                      <Loader2 size={16} className="lt-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
                <button type="button" disabled={saving} onClick={tryLeaveForm} className="lt-btn-ghost">
                  Cancel
                </button>
              </footer>
            </div>
          </form>
        ) : (
          <>
            <header className="lt-page-header">
              <div className="lt-page-header-copy">
                <p className="lt-eyebrow">Student organization</p>
                <h1 className="lt-page-title">Leadership board</h1>
                <p className="lt-page-desc">
                  Your administrative board appears on your public profile. Each person holds a defined position.
                </p>
              </div>
              {!listLoading && members.length > 0 && (
                <button type="button" onClick={startCreate} className="lt-btn-primary lt-btn-primary--header">
                  <Plus size={17} strokeWidth={2.25} />
                  Add position
                </button>
              )}
            </header>

            {shell.loading || listLoading ? (
              <div className="lt-profile-grid" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="lt-profile-skeleton" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="lt-empty">
                <div className="lt-empty-icon">
                  <Users size={28} strokeWidth={1.75} />
                </div>
                <h2 className="lt-empty-title">Build your leadership board</h2>
                <p className="lt-empty-desc">
                  Add presidents, coordinators, and leads—each with their own position on your public profile.
                </p>
                <button type="button" onClick={startCreate} className="lt-btn-primary">
                  <Plus size={17} strokeWidth={2.25} />
                  Add your first position
                </button>
              </div>
            ) : (
              <section className="lt-roster">
                <div className="lt-roster-bar">
                  <span className="lt-roster-count">
                    {members.length} position{members.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="lt-profile-grid">
                  {sortedMembers.map((m) => (
                    <LeadershipProfileCard
                      key={m.id}
                      fullName={m.fullName}
                      roleTitle={m.roleTitle}
                      major={m.major}
                      imageUrl={m.imageUrl}
                      linkedInUrl={m.linkedInUrl}
                      organizationName={orgName}
                      deleting={deletingId === m.id}
                      onEdit={() => startEdit(m)}
                      onDelete={() => void handleDelete(m)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <PageStyles />
      </div>
    </AssociationDashboardLayout>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="lt-section">
      <div className={`lt-section-head${description ? '' : ' lt-section-head--compact'}`}>
        <h2 className="lt-section-title">{title}</h2>
        {description ? <p className="lt-section-desc">{description}</p> : null}
      </div>
      <div className="lt-section-body">{children}</div>
    </section>
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
    <label className="lt-field">
      <span className="lt-field-label">
        {label}
        {required && <span className="lt-req">*</span>}
        {optional && <span className="lt-opt">Optional</span>}
      </span>
      {children}
    </label>
  )
}

function PageStyles() {
  return (
    <style>{`
      .lt-page {
        max-width: 1120px;
      }

      .lt-page-header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 28px;
      }

      .lt-eyebrow {
        margin: 0;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: ${assocDash.accent};
      }

      .lt-page-title {
        margin: 6px 0 0;
        font-family: ${assocDash.fontDisplay};
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: ${assocDash.text};
        line-height: 1.2;
      }

      .lt-page-desc {
        margin: 10px 0 0;
        max-width: 520px;
        font-size: 14px;
        line-height: 1.6;
        color: ${assocDash.muted};
      }

      .lt-btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 18px;
        height: 40px;
        border: none;
        border-radius: 10px;
        background: ${assocDash.accent};
        color: ${assocDash.white};
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        box-shadow: ${assocDash.shadow};
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      }

      .lt-btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${assocDash.shadowHover};
      }

      .lt-btn-primary:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        transform: none;
      }

      .lt-btn-primary--header {
        flex-shrink: 0;
      }

      .lt-btn-ghost {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        padding: 0 18px;
        border-radius: 10px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.surface};
        color: ${assocDash.textSecondary};
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .lt-btn-ghost:hover:not(:disabled) {
        background: ${assocDash.bg};
        border-color: ${assocDash.accentBorder};
      }

      .lt-btn-ghost:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .lt-spin {
        animation: lt-spin 0.85s linear infinite;
      }

      @keyframes lt-spin {
        to { transform: rotate(360deg); }
      }

      .lt-empty {
        text-align: center;
        padding: 56px 32px;
        border-radius: ${assocDash.radiusLg}px;
        border: 1px dashed ${assocDash.border};
        background: ${assocDash.gradientSurface};
      }

      .lt-empty-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 20px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
        color: ${assocDash.accentDark};
      }

      .lt-empty-title {
        margin: 0 0 8px;
        font-family: ${assocDash.fontDisplay};
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: ${assocDash.text};
      }

      .lt-empty-desc {
        margin: 0 auto 24px;
        max-width: 400px;
        font-size: 14px;
        line-height: 1.6;
        color: ${assocDash.muted};
      }

      .lt-profile-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
      }

      .lt-profile-skeleton {
        height: 340px;
        border-radius: 20px;
        background: linear-gradient(90deg, hsl(var(--aw-skeleton-from)) 25%, hsl(var(--aw-skeleton-mid)) 50%, hsl(var(--aw-skeleton-from)) 75%);
        background-size: 200% 100%;
        animation: lt-shimmer 1.4s ease infinite;
      }

      .lt-roster-bar {
        margin-bottom: 12px;
        padding: 0 4px;
      }

      .lt-roster-count {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: ${assocDash.subtle};
      }

      @keyframes lt-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .lt-form-shell {
        display: block;
      }

      .lt-form-topbar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .lt-unsaved-pill {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: ${assocDash.accentInk};
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
      }

      .lt-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px 8px 10px;
        margin-left: -10px;
        border: none;
        border-radius: 9px;
        background: transparent;
        color: ${assocDash.muted};
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .lt-back-btn:hover:not(:disabled) {
        background: ${assocDash.bg};
        color: ${assocDash.text};
      }

      .lt-form-card {
        border-radius: 18px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.surface};
        box-shadow: ${assocDash.shadowLg};
        overflow: hidden;
      }

      .lt-form-card-header {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 28px 32px 0;
      }

      .lt-form-title-icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${assocDash.accentMuted};
        border: 1px solid ${assocDash.accentBorder};
        color: ${assocDash.accentDark};
      }

      .lt-form-title {
        margin: 0;
        font-family: ${assocDash.fontDisplay};
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.025em;
        color: ${assocDash.text};
        line-height: 1.25;
      }

      .lt-form-subtitle {
        margin: 5px 0 0;
        font-size: 14px;
        line-height: 1.55;
        color: ${assocDash.muted};
      }

      .lt-form-grid {
        display: grid;
        grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
        gap: 40px;
        padding: 28px 32px 8px;
        align-items: start;
      }

      @media (max-width: 820px) {
        .lt-form-grid {
          grid-template-columns: 1fr;
          gap: 32px;
        }
      }

      .lt-preview-aside {
        position: sticky;
        top: 24px;
      }

      @media (max-width: 820px) {
        .lt-preview-aside {
          position: static;
        }
      }

      .lt-aside-label {
        margin: 0 0 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: ${assocDash.subtle};
      }

      .lt-aside-note {
        margin: 12px 0 0;
        font-size: 12px;
        line-height: 1.55;
        color: ${assocDash.subtle};
      }

      .lt-fields-stack {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
      }

      .lt-section + .lt-section {
        padding-top: 20px;
        border-top: 1px solid ${assocDash.border};
      }

      .lt-section-head {
        margin-bottom: 12px;
      }

      .lt-section-head--compact {
        margin-bottom: 10px;
      }

      .lt-section-title {
        margin: 0;
        font-family: ${assocDash.fontDisplay};
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: ${assocDash.text};
      }

      .lt-section-desc {
        margin: 4px 0 0;
        font-size: 13px;
        color: ${assocDash.subtle};
        line-height: 1.45;
      }

      .lt-section-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .lt-advanced-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        align-self: flex-start;
        padding: 0;
        border: none;
        background: none;
        font-size: 12px;
        font-weight: 600;
        color: ${assocDash.muted};
        cursor: pointer;
        font-family: inherit;
        transition: color 0.15s ease;
      }

      .lt-advanced-toggle:hover {
        color: ${assocDash.text};
      }

      .lt-advanced-toggle svg {
        transition: transform 0.18s ease;
      }

      .lt-advanced-toggle--open svg {
        transform: rotate(180deg);
      }

      .lt-field-hint {
        margin: 6px 0 0;
        font-size: 12px;
        line-height: 1.45;
        color: ${assocDash.subtle};
      }

      .lt-field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      @media (max-width: 560px) {
        .lt-field-row {
          grid-template-columns: 1fr;
        }
      }

      .lt-field-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 7px;
        font-size: 12px;
        font-weight: 600;
        color: ${assocDash.textSecondary};
      }

      .lt-req {
        color: ${assocDash.error};
      }

      .lt-opt {
        font-size: 11px;
        font-weight: 500;
        color: ${assocDash.subtle};
        padding: 1px 7px;
        border-radius: 999px;
        background: ${assocDash.bg};
        border: 1px solid ${assocDash.border};
      }

      .lt-input {
        width: 100%;
        height: 44px;
        padding: 0 14px;
        border-radius: 10px;
        border: 1px solid ${assocDash.border};
        background: ${assocDash.surface};
        font-size: 14px;
        font-family: inherit;
        color: ${assocDash.text};
        box-sizing: border-box;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .lt-input::placeholder {
        color: ${assocDash.subtle};
      }

      .lt-input:hover {
        border-color: ${assocDash.accentBorder};
      }

      .lt-input:focus {
        outline: none;
        border-color: ${assocDash.accent};
        box-shadow: ${assocDash.focusShadow};
      }

      .lt-form-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
        padding: 18px 32px 24px;
        border-top: 1px solid ${assocDash.border};
        background: linear-gradient(180deg, hsl(var(--aw-shell-bg) / 0.5) 0%, hsl(var(--aw-shell-bg) / 0.95) 100%);
        position: sticky;
        bottom: 0;
        z-index: 2;
      }

      @media (max-width: 820px) {
        .lt-form-card-header,
        .lt-form-grid,
        .lt-form-footer {
          padding-left: 20px;
          padding-right: 20px;
        }
      }
    `}</style>
  )
}
