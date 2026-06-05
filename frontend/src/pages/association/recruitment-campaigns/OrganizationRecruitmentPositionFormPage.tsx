import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getOrganizationRecruitmentCampaign,
  parseApiErrorMessage,
} from '@/api/recruitmentCampaignsApi'
import {
  PositionApplicationFormEditor,
  positionApplicationFormPath,
} from '@/components/association/PositionApplicationFormEditor'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocDash } from '../dashboard/associationDashTokens'
import { useAssociationShell } from '../events/useAssociationShell'

export default function OrganizationRecruitmentPositionFormPage() {
  const { campaignId, positionId } = useParams<{ campaignId: string; positionId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [loading, setLoading] = useState(true)
  const [positionTitle, setPositionTitle] = useState('')

  const campaignNum = Number(campaignId)
  const positionNum = Number(positionId)

  const backTo = useMemo(
    () =>
      Number.isFinite(campaignNum)
        ? `/association/recruitment/${campaignNum}/edit`
        : '/association/recruitment',
    [campaignNum],
  )

  useEffect(() => {
    if (!Number.isFinite(campaignNum) || !Number.isFinite(positionNum)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const campaign = await getOrganizationRecruitmentCampaign(campaignNum)
        const position = campaign.positions.find((p) => p.id === positionNum)
        if (!position) {
          toast.error('Position not found')
          if (!cancelled) navigate(backTo)
          return
        }
        if (!cancelled) setPositionTitle(position.roleTitle)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate(backTo)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [campaignNum, positionNum, navigate, backTo])

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
      wideContent
    >
      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading…</p>
      ) : Number.isFinite(campaignNum) && Number.isFinite(positionNum) ? (
        <PositionApplicationFormEditor
          campaignId={campaignNum}
          positionId={positionNum}
          positionTitle={positionTitle}
          backTo={backTo}
          backLabel="Back to executive board selection applications"
        />
      ) : null}
    </AssociationDashboardLayout>
  )
}

export { positionApplicationFormPath }
