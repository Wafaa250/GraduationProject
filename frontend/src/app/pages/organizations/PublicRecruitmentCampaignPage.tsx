import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import {
  getPublicRecruitmentCampaign,
  parseApiErrorMessage,
  type PublicRecruitmentCampaignDetail,
} from '../../../api/recruitmentCampaignsApi'
import { PublicRecruitmentPositionCard } from '../../components/association/PublicRecruitmentPositionCard'
import { AssociationAvatar } from '../../components/association/associationBrand'
import { assocDash } from '../association/dashboard/associationDashTokens'
import { formatEventDate } from '../association/events/eventFormUtils'
import { publicOrgPage } from './publicOrgPageStyles'

export default function PublicRecruitmentCampaignPage() {
  const { organizationId, campaignId } = useParams<{ organizationId: string; campaignId: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<PublicRecruitmentCampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const orgId = Number(organizationId)
  const campId = Number(campaignId)

  useEffect(() => {
    if (!Number.isFinite(orgId) || !Number.isFinite(campId)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getPublicRecruitmentCampaign(orgId, campId)
        if (!cancelled) setCampaign(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate(`/organizations/${organizationId}`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [organizationId, campaignId, navigate, orgId, campId])

  const cover = campaign?.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null
  const positions = [...(campaign?.positions ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
  return (
    <div style={publicOrgPage.page}>
      <nav style={publicOrgPage.nav}>
        <div style={publicOrgPage.navInner}>
          <button type="button" onClick={() => navigate(-1)} style={publicOrgPage.backBtn}>
            <ArrowLeft size={14} />
            Back
          </button>
          <span style={publicOrgPage.logoText}>
            Skill<span style={publicOrgPage.logoAccent}>Swap</span>
          </span>
        </div>
      </nav>

      <div style={publicOrgPage.content}>
        <Link
          to={`/organizations/${orgId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            color: assocDash.accentDark,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          Back to organization
        </Link>

        {loading ? (
          <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading campaign…</p>
        ) : campaign ? (
          <>
            <div
              style={{
                ...publicOrgPage.card,
                overflow: 'hidden',
                marginBottom: 24,
                border: `1px solid ${assocDash.border}`,
              }}
            >
              <div
                style={{
                  minHeight: 180,
                  background: cover
                    ? `center/cover no-repeat url(${cover})`
                    : `linear-gradient(135deg, ${assocDash.accentMuted}, #fff 70%)`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: cover ? 'linear-gradient(to top, rgba(15,23,42,0.7), transparent 50%)' : 'none',
                  }}
                />
                <div style={{ position: 'relative', padding: '40px 28px 24px', color: cover ? '#fff' : assocDash.text }}>
                  <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{campaign.title}</h1>
                  <p
                    style={{
                      margin: '12px 0 0',
                      fontSize: 14,
                      opacity: cover ? 0.95 : 1,
                      color: cover ? '#fff' : assocDash.muted,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Calendar size={16} />
                    Apply by {formatEventDate(campaign.applicationDeadline)}
                  </p>
                </div>
              </div>
              <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <AssociationAvatar
                    name={campaign.organizationName}
                    logoUrl={campaign.organizationLogoUrl}
                    size="sm"
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: assocDash.text }}>{campaign.organizationName}</span>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: assocDash.text, whiteSpace: 'pre-wrap' }}>
                  {campaign.description}
                </p>

                {positions.length > 0 ? (
                  <div
                    style={{
                      marginTop: 28,
                      paddingTop: 24,
                      borderTop: `1px solid ${assocDash.border}`,
                    }}
                  >
                    <h2 style={{ ...publicOrgPage.sectionTitle, margin: '0 0 16px', fontSize: 18 }}>
                      Open positions
                    </h2>
                    {positions.map((position) => (
                      <PublicRecruitmentPositionCard
                        key={position.id}
                        position={position}
                        questions={campaign.questions}
                      />
                    ))}
                  </div>
                ) : null}

              </div>
            </div>
          </>
        ) : (
          <p style={{ color: assocDash.muted }}>Campaign not found.</p>
        )}
      </div>
    </div>
  )
}
