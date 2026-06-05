import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createOrganizationRecruitmentCampaign,
  parseApiErrorMessage,
} from '@/api/recruitmentCampaignsApi'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocDash, assocType } from '../dashboard/associationDashTokens'
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
      <div className="opportunity-create-page">
        <Link to="/association/recruitment" className="opportunity-create-back">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          Back to executive board selection applications
        </Link>

        <header className="opportunity-create-hero">
          <div className="opportunity-create-hero-icon" aria-hidden>
            <Users size={22} strokeWidth={2} />
          </div>
          <div>
            <p style={{ ...assocType.eyebrow, margin: 0 }}>New executive board selection applications</p>
            <h1 style={{ ...assocType.pageTitle, margin: '6px 0 0', fontSize: 28, lineHeight: 1.2 }}>
              Open selection applications
            </h1>
            <p style={{ ...assocType.bodySm, margin: '10px 0 0', maxWidth: 560 }}>
              Invite students to join your team. Set up open positions first — you can design each
              position&apos;s application form after saving.
            </p>
          </div>
        </header>

        {!shell.loading && (
          <RecruitmentCampaignForm
            mode="create"
            submitLabel="Create selection"
            cancelTo="/association/recruitment"
            saving={saving}
            onSubmit={async (payload) => {
              setSaving(true)
              try {
                const created = await createOrganizationRecruitmentCampaign(payload)
                toast.success('Selection saved as draft — complete application forms, then publish from the list')
                navigate(`/association/recruitment/${created.id}/edit`)
              } catch (err) {
                toast.error(parseApiErrorMessage(err))
                throw err
              } finally {
                setSaving(false)
              }
            }}
          />
        )}
      </div>

      <style>{`
        .opportunity-create-page {
          max-width: 960px;
          margin: 0 auto;
        }
        .opportunity-create-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 600;
          color: ${assocDash.accentDark};
          text-decoration: none;
        }
        .opportunity-create-back:hover {
          color: ${assocDash.accent};
        }
        .opportunity-create-hero {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 32px;
        }
        .opportunity-create-hero-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${assocDash.accentMuted};
          border: 1px solid ${assocDash.accentBorder};
          color: ${assocDash.accentDark};
        }
      `}</style>
    </AssociationDashboardLayout>
  )
}
