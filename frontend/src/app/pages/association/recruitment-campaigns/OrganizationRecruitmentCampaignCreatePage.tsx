import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  createOrganizationRecruitmentCampaign,
  parseApiErrorMessage,
} from '../../../../api/recruitmentCampaignsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocDash } from '../dashboard/associationDashTokens'
import { RecruitmentCampaignForm } from './RecruitmentCampaignForm'
import { useAssociationShell } from '../events/useAssociationShell'

export default function OrganizationRecruitmentCampaignCreatePage() {
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [saving, setSaving] = useState(false)

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
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: assocDash.accent }}>
          Student Organization
        </p>
        <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, fontFamily: assocDash.fontDisplay }}>
          Create recruitment campaign
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: assocDash.muted }}>
          Set up your campaign and positions first. After saving, design each position&apos;s application
          form separately.
        </p>
      </header>

      {!shell.loading && (
        <RecruitmentCampaignForm
          mode="create"
          submitLabel="Create campaign"
          cancelTo="/organization/recruitment-campaigns"
          saving={saving}
          onSubmit={async (payload) => {
            setSaving(true)
            try {
              const created = await createOrganizationRecruitmentCampaign(payload)
              toast.success('Campaign created — you can now design application forms for each position')
              navigate(`/organization/recruitment-campaigns/${created.id}/edit`)
            } catch (err) {
              toast.error(parseApiErrorMessage(err))
              throw err
            } finally {
              setSaving(false)
            }
          }}
        />
      )}
    </AssociationDashboardLayout>
  )
}
