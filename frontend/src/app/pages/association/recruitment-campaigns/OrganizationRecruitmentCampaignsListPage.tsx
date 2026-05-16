import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../../api/axiosInstance'
import {
  deleteOrganizationRecruitmentCampaign,
  listOrganizationRecruitmentCampaigns,
  parseApiErrorMessage,
  type RecruitmentCampaign,
} from '../../../../api/recruitmentCampaignsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { formatEventDate } from '../events/eventFormUtils'
import { useAssociationShell } from '../events/useAssociationShell'

export default function OrganizationRecruitmentCampaignsListPage() {
  const shell = useAssociationShell()
  const [campaigns, setCampaigns] = useState<RecruitmentCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listOrganizationRecruitmentCampaigns()
      setCampaigns(data)
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (c: RecruitmentCampaign) => {
    if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return
    setDeletingId(c.id)
    try {
      await deleteOrganizationRecruitmentCampaign(c.id)
      toast.success('Campaign deleted')
      setCampaigns((prev) => prev.filter((x) => x.id !== c.id))
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginTop: 6 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, fontFamily: assocDash.fontDisplay }}>
              Recruitment campaigns
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted, maxWidth: 480 }}>
              Publish open roles with custom position titles. Students will apply to a specific position later.
            </p>
          </div>
          <Link to="/organization/recruitment-campaigns/create" style={createBtnStyle}>
            <Plus size={18} />
            Create campaign
          </Link>
        </div>
      </header>

      {shell.loading || loading ? (
        <p style={{ color: assocDash.muted }}>Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <div style={{ ...assocCard, padding: 40, textAlign: 'center' }}>
          <Megaphone size={40} color={assocDash.accent} style={{ marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>No campaigns yet</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: assocDash.muted }}>
            Add required positions like Graphic Designer or Organizer—your organization chooses the titles.
          </p>
          <Link to="/organization/recruitment-campaigns/create" style={createBtnStyle}>
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              deleting={deletingId === c.id}
              onDelete={() => void handleDelete(c)}
            />
          ))}
        </div>
      )}
    </AssociationDashboardLayout>
  )
}

function CampaignCard({
  campaign,
  deleting,
  onDelete,
}: {
  campaign: RecruitmentCampaign
  deleting: boolean
  onDelete: () => void
}) {
  const cover = campaign.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null
  const positionCount = campaign.positions?.length ?? 0

  return (
    <article style={{ ...assocCard, padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          height: 120,
          background: cover
            ? `center/cover no-repeat url(${cover})`
            : `linear-gradient(135deg, ${assocDash.accentMuted}, #fff)`,
        }}
      />
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={badge}>{positionCount} position{positionCount === 1 ? '' : 's'}</span>
          {!campaign.isPublished ? <span style={{ ...badge, opacity: 0.85 }}>Draft</span> : null}
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>{campaign.title}</h3>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: assocDash.muted }}>
          Apply by {formatEventDate(campaign.applicationDeadline)}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <ActionLink to={`/organization/recruitment-campaigns/${campaign.id}`} icon={Eye}>
            View
          </ActionLink>
          <ActionLink to={`/organization/recruitment-campaigns/${campaign.id}/edit`} icon={Pencil}>
            Edit
          </ActionLink>
          <button type="button" onClick={onDelete} disabled={deleting} style={deleteBtnStyle}>
            <Trash2 size={14} />
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

function ActionLink({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: typeof Eye
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 12px',
        borderRadius: 8,
        border: `1px solid ${assocDash.border}`,
        fontSize: 12,
        fontWeight: 600,
        color: assocDash.accentDark,
        textDecoration: 'none',
      }}
    >
      <Icon size={14} />
      {children}
    </Link>
  )
}

const badge: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: 6,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  border: `1px solid ${assocDash.accentBorder}`,
}

const createBtnStyle: React.CSSProperties = {
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
}

const deleteBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: '#b91c1c',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
