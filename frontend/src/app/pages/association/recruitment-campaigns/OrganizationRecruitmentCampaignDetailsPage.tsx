import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, ClipboardList, Pencil, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../../api/axiosInstance'
import {
  getOrganizationRecruitmentCampaign,
  listRecruitmentCampaignQuestions,
  parseApiErrorMessage,
  parseSkillsList,
  type RecruitmentCampaign,
  type RecruitmentQuestion,
} from '../../../../api/recruitmentCampaignsApi'
import { countQuestionsForPosition } from '../../../../utils/recruitmentFormFields'
import { positionApplicationFormPath } from '../../../components/association/PositionApplicationFormEditor'
import { AssociationDashboardLayout } from '../dashboard/AssociationDashboardLayout'
import { assocCard, assocDash } from '../dashboard/associationDashTokens'
import { formatEventDate } from '../events/eventFormUtils'
import { useAssociationShell } from '../events/useAssociationShell'

export default function OrganizationRecruitmentCampaignDetailsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const shell = useAssociationShell()
  const [campaign, setCampaign] = useState<RecruitmentCampaign | null>(null)
  const [questions, setQuestions] = useState<RecruitmentQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(campaignId)
    if (!Number.isFinite(id)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [data, qs] = await Promise.all([
          getOrganizationRecruitmentCampaign(id),
          listRecruitmentCampaignQuestions(id),
        ])
        if (!cancelled) {
          setCampaign(data)
          setQuestions(qs)
        }
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
  }, [campaignId, navigate])

  const cover = campaign?.coverImageUrl ? resolveApiFileUrl(campaign.coverImageUrl) : null
  const positions = [...(campaign?.positions ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <AssociationDashboardLayout
      associationName={shell.name}
      sidebarProfile={shell.sidebarProfile}
      sidebarMobileOpen={shell.sidebarMobileOpen}
      onSidebarOpen={() => shell.setSidebarMobileOpen(true)}
      onSidebarClose={() => shell.setSidebarMobileOpen(false)}
      onLogout={shell.handleLogout}
    >
      <Link
        to="/organization/recruitment-campaigns"
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
        Back to campaigns
      </Link>

      {loading || shell.loading ? (
        <p style={{ color: assocDash.muted }}>Loading campaign…</p>
      ) : campaign ? (
        <>
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 24,
              border: `1px solid ${assocDash.border}`,
              background: cover
                ? `center/cover no-repeat url(${cover})`
                : `linear-gradient(135deg, ${assocDash.accentMuted}, #fff)`,
              minHeight: 180,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: cover ? 'linear-gradient(to top, rgba(15,23,42,0.75), transparent 55%)' : 'none',
              }}
            />
            <div style={{ position: 'relative', padding: '40px 28px 24px', color: cover ? '#fff' : assocDash.text }}>
              {!campaign.isPublished ? (
                <span style={draftBadge}>Draft</span>
              ) : null}
              <h1 style={{ margin: campaign.isPublished ? 0 : '12px 0 0', fontSize: 28, fontWeight: 800 }}>
                {campaign.title}
              </h1>
            </div>
          </div>

          <Link
            to={`/organization/recruitment-campaigns/${campaign.id}/edit`}
            style={{
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
              marginBottom: 24,
            }}
          >
            <Pencil size={16} />
            Edit campaign
          </Link>

          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div style={{ ...assocCard, padding: 24 }}>
              <h2 style={sectionTitle}>Overview</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: assocDash.text, whiteSpace: 'pre-wrap' }}>
                {campaign.description}
              </p>
              <p style={{ margin: '16px 0 0', fontSize: 13, color: assocDash.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} />
                Apply by {formatEventDate(campaign.applicationDeadline)}
              </p>
            </div>
          </div>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 16 }}>Required positions ({positions.length})</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {positions.map((p) => {
                const skills = parseSkillsList(p.requiredSkills)
                return (
                  <article key={p.id} style={{ ...assocCard, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{p.roleTitle}</h3>
                      <span style={countBadge}>
                        <Users size={14} />
                        {p.neededCount} needed
                      </span>
                    </div>
                    {p.description?.trim() ? <p style={body}>{p.description}</p> : null}
                    {p.requirements?.trim() ? (
                      <>
                        <p style={label}>Requirements</p>
                        <p style={body}>{p.requirements}</p>
                      </>
                    ) : null}
                    {skills.length > 0 ? (
                      <>
                        <p style={label}>Skills</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {skills.map((s) => (
                            <span key={s} style={chip}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}
                    <Link
                      to={positionApplicationFormPath(campaign.id, p.id)}
                      style={formEditLink}
                    >
                      <ClipboardList size={16} />
                      {countQuestionsForPosition(questions, p.id) > 0
                        ? 'Edit application form'
                        : 'Create application form'}
                    </Link>
                  </article>
                )
              })}
            </div>
          </section>
        </>
      ) : null}
    </AssociationDashboardLayout>
  )
}

const sectionTitle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 16,
  fontWeight: 800,
  fontFamily: assocDash.fontDisplay,
}

const draftBadge: CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.2)',
  border: '1px solid rgba(255,255,255,0.35)',
}

const countBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 10,
  background: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  fontSize: 12,
  fontWeight: 800,
  color: assocDash.accentDark,
}

const label: CSSProperties = {
  margin: '12px 0 4px',
  fontSize: 11,
  fontWeight: 800,
  color: assocDash.subtle,
  textTransform: 'uppercase',
}

const body: CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.6, color: assocDash.text }

const chip: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 8,
  background: assocDash.accentMuted,
  border: `1px solid ${assocDash.accentBorder}`,
  fontSize: 12,
  fontWeight: 700,
  color: assocDash.accentDark,
}

const formEditLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 16,
  padding: '10px 16px',
  borderRadius: assocDash.radiusMd,
  border: `1px solid ${assocDash.accentBorder}`,
  background: assocDash.accentMuted,
  color: assocDash.accentDark,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
}
