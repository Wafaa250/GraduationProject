import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getOrganizationRecruitmentCampaign,
  parseApiErrorMessage,
  updateOrganizationRecruitmentCampaign,
  type RecruitmentCampaign,
} from '../../../../api/recruitmentCampaignsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocDash } from '../dashboard/associationDashTokens'
import { RecruitmentCampaignForm, campaignToFormValues } from './RecruitmentCampaignForm'
import { useAssociationShell } from '../events/useAssociationShell'

export default function OrganizationRecruitmentCampaignEditPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [campaign, setCampaign] = useState<RecruitmentCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const id = Number(campaignId)

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getOrganizationRecruitmentCampaign(id)
        if (!cancelled) setCampaign(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate('/organization/recruitment-campaigns')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, navigate])

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
        <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, fontFamily: assocDash.fontDisplay }}>
          Edit campaign
        </h1>
        {campaign ? (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted }}>{campaign.title}</p>
        ) : null}
      </header>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted }}>Loading campaign…</p>
      ) : campaign ? (
        <RecruitmentCampaignForm
          key={campaign.id}
          mode="edit"
          initialValues={campaignToFormValues(campaign)}
          submitLabel="Save changes"
          cancelTo={`/organization/recruitment-campaigns/${id}`}
          saving={saving}
          campaignId={id}
          onSubmit={async (payload) => {
            setSaving(true)
            try {
              await updateOrganizationRecruitmentCampaign(id, payload)
              toast.success('Campaign updated')
              navigate(`/organization/recruitment-campaigns/${id}`)
            } catch (err) {
              toast.error(parseApiErrorMessage(err))
              throw err
            } finally {
              setSaving(false)
            }
          }}
        />
      ) : null}
    </AssociationDashboardLayout>
  )
}
