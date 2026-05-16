import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Heart, Loader2, Linkedin, Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveApiFileUrl } from '../../../api/axiosInstance'
import {
  followOrganization,
  getOrganizationFollowStatus,
  getPublicOrganization,
  parseApiErrorMessage,
  unfollowOrganization,
  type PublicLeadershipTeamMember,
  type PublicStudentOrganizationProfile,
} from '../../../api/organizationsApi'
import { PublicOrganizationEventCard } from '../../components/association/PublicOrganizationEventCard'
import { PublicRecruitmentCampaignCard } from '../../components/association/PublicRecruitmentCampaignCard'
import {
  listPublicRecruitmentCampaigns,
  type PublicRecruitmentCampaignSummary,
} from '../../../api/recruitmentCampaignsApi'
import { AssociationAvatar, CategoryBadge, VerifiedBadge } from '../../components/association/associationBrand'
import { SocialLinksList } from '../../components/association/SocialLinksList'
import { assocDash } from '../association/dashboard/associationDashTokens'
import { formatJoinedDate, publicOrgPage } from './publicOrgPageStyles'

const isStudentRole = () => (localStorage.getItem('role') ?? '').toLowerCase() === 'student'

export default function PublicOrganizationProfilePage() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicStudentOrganizationProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayFollowers, setDisplayFollowers] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followStatusLoading, setFollowStatusLoading] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [recruitmentCampaigns, setRecruitmentCampaigns] = useState<PublicRecruitmentCampaignSummary[]>([])
  const [recruitmentLoading, setRecruitmentLoading] = useState(false)

  const orgId = Number(organizationId)
  const isStudent = isStudentRole()

  useEffect(() => {
    if (!Number.isFinite(orgId)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await getPublicOrganization(orgId)
        if (!cancelled) setProfile(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
        if (!cancelled) navigate(-1)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [organizationId, navigate, orgId])

  useEffect(() => {
    if (profile) setDisplayFollowers(profile.followersCount ?? 0)
  }, [profile])

  useEffect(() => {
    if (!isStudent || !Number.isFinite(orgId) || !profile) return
    let cancelled = false
    ;(async () => {
      setFollowStatusLoading(true)
      try {
        const s = await getOrganizationFollowStatus(orgId)
        if (!cancelled) setIsFollowing(s.isFollowing)
      } catch {
        if (!cancelled) setIsFollowing(false)
      } finally {
        if (!cancelled) setFollowStatusLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isStudent, orgId, profile])

  useEffect(() => {
    if (!Number.isFinite(orgId) || !profile) return
    let cancelled = false
    ;(async () => {
      setRecruitmentLoading(true)
      try {
        const data = await listPublicRecruitmentCampaigns(orgId)
        if (!cancelled) setRecruitmentCampaigns(data)
      } catch {
        if (!cancelled) setRecruitmentCampaigns([])
      } finally {
        if (!cancelled) setRecruitmentLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orgId, profile])

  const joinedLabel = profile ? formatJoinedDate(profile.createdAt) : ''
  const about = profile?.description?.trim()
  const leadershipTeam = profile?.leadershipTeam ?? []
  const hasSocial =
    !!profile?.instagramUrl?.trim() ||
    !!profile?.facebookUrl?.trim() ||
    !!profile?.linkedInUrl?.trim()

  const onToggleFollow = async () => {
    if (!profile || followBusy) return
    const nextFollowing = !isFollowing
    const prevFollowing = isFollowing
    const prevCount = displayFollowers

    setFollowBusy(true)
    setIsFollowing(nextFollowing)
    setDisplayFollowers((c) => (nextFollowing ? c + 1 : Math.max(0, c - 1)))

    try {
      if (nextFollowing) {
        await followOrganization(orgId)
        setIsFollowing(true)
        toast.success(`You are following ${profile.organizationName}`)
      } else {
        await unfollowOrganization(orgId)
        setIsFollowing(false)
        toast.success('Unfollowed')
      }
    } catch (e) {
      setIsFollowing(prevFollowing)
      setDisplayFollowers(prevCount)
      toast.error(parseApiErrorMessage(e))
    } finally {
      setFollowBusy(false)
    }
  }

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
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 600,
              color: assocDash.muted,
              padding: '4px 10px',
              borderRadius: 8,
              background: assocDash.accentMuted,
              border: `1px solid ${assocDash.accentBorder}`,
            }}
          >
            Student Organization
          </span>
        </div>
      </nav>

      <div style={publicOrgPage.content}>
        {loading ? (
          <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading organization…</p>
        ) : profile ? (
          <>
            <section style={{ ...publicOrgPage.card, overflow: 'hidden', marginBottom: 24 }}>
              <div
                style={{
                  height: 120,
                  background: `linear-gradient(120deg, ${assocDash.accent} 0%, #fbbf24 45%, #fef3c7 100%)`,
                  opacity: 0.95,
                }}
              />
              <div style={{ padding: '0 28px 28px', marginTop: -56 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 20,
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end', flex: 1, minWidth: 200 }}>
                    <AssociationAvatar
                      name={profile.organizationName}
                      logoUrl={profile.logoUrl}
                      size="xl"
                      style={{
                        border: '4px solid #fff',
                        boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 200, paddingBottom: 4 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: assocDash.accent }}>
                        Student Organization
                      </p>
                      <h1
                        style={{
                          margin: '6px 0 8px',
                          fontSize: 28,
                          fontWeight: 800,
                          fontFamily: assocDash.fontDisplay,
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                        }}
                      >
                        {profile.organizationName}
                      </h1>
                      {profile.faculty && (
                        <p style={{ margin: '0 0 10px', fontSize: 14, color: assocDash.muted }}>{profile.faculty}</p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {profile.category && <CategoryBadge category={profile.category} />}
                        {profile.isVerified && <VerifiedBadge />}
                      </div>
                      <p style={{ margin: '10px 0 0', fontSize: 13, color: assocDash.muted }}>
                        {displayFollowers.toLocaleString()} follower{displayFollowers === 1 ? '' : 's'}
                      </p>
                      {joinedLabel && (
                        <p style={{ margin: '8px 0 0', fontSize: 13, color: assocDash.subtle }}>
                          Joined SkillSwap in {joinedLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {isStudent && (
                    <div style={{ paddingBottom: 4 }}>
                      {followStatusLoading ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 18px',
                            borderRadius: assocDash.radiusMd,
                            border: `1px solid ${assocDash.border}`,
                            color: assocDash.muted,
                            fontSize: 13,
                          }}
                        >
                          <Loader2 size={16} className="public-org-follow-spin" />
                          …
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={followBusy}
                          onClick={() => void onToggleFollow()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 20px',
                            borderRadius: assocDash.radiusMd,
                            border: isFollowing ? `1px solid ${assocDash.border}` : 'none',
                            background: isFollowing ? '#fff' : assocDash.gradient,
                            color: isFollowing ? assocDash.accentDark : '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: followBusy ? 'wait' : 'pointer',
                            fontFamily: 'inherit',
                            boxShadow: isFollowing ? '0 2px 8px rgba(15,23,42,0.06)' : '0 4px 14px rgba(245,158,11,0.35)',
                            opacity: followBusy ? 0.85 : 1,
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                        >
                          {followBusy ? (
                            <Loader2 size={16} className="public-org-follow-spin" />
                          ) : (
                            <Heart size={16} fill={isFollowing ? assocDash.accent : 'transparent'} />
                          )}
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 20,
                marginBottom: 20,
              }}
            >
              <section style={{ ...publicOrgPage.card, padding: 28 }}>
                <h2 style={publicOrgPage.sectionTitle}>About</h2>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: assocDash.text }}>
                  {about || 'This student organization has not added a public description yet.'}
                </p>
              </section>

              {hasSocial && (
                <section style={{ ...publicOrgPage.card, padding: 28 }}>
                  <h2 style={publicOrgPage.sectionTitle}>Connect</h2>
                  <SocialLinksList
                    instagramUrl={profile.instagramUrl}
                    facebookUrl={profile.facebookUrl}
                    linkedInUrl={profile.linkedInUrl}
                  />
                </section>
              )}
            </div>

            {leadershipTeam.length > 0 && (
              <section style={{ ...publicOrgPage.card, padding: 28, marginBottom: 20 }}>
                <h2 style={publicOrgPage.sectionTitle}>Leadership team</h2>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: assocDash.muted, maxWidth: 640, lineHeight: 1.6 }}>
                  Meet the student leaders and coordinators representing this organization on campus. These profiles are
                  for visibility only and are not SkillSwap admin accounts.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 18,
                  }}
                >
                  {leadershipTeam.map((member) => (
                    <LeadershipMemberCard key={member.id} member={member} />
                  ))}
                </div>
              </section>
            )}

            <section style={{ ...publicOrgPage.card, padding: 28, marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Megaphone size={22} color={assocDash.accent} />
                  <h2 style={{ ...publicOrgPage.sectionTitle, margin: 0 }}>Open recruitment</h2>
                </div>
              </div>

              {recruitmentLoading ? (
                <p style={{ margin: 0, fontSize: 14, color: assocDash.muted }}>Loading campaigns…</p>
              ) : recruitmentCampaigns.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '28px 20px',
                    borderRadius: assocDash.radiusMd,
                    background: assocDash.accentMuted,
                    border: `1px dashed ${assocDash.accentBorder}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: assocDash.text }}>
                    No open recruitment campaigns right now.
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: assocDash.muted }}>
                    Check back later for published roles and deadlines.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 18,
                  }}
                >
                  {recruitmentCampaigns.map((campaign) => (
                    <PublicRecruitmentCampaignCard
                      key={campaign.id}
                      organizationId={orgId}
                      campaign={campaign}
                    />
                  ))}
                </div>
              )}
            </section>

            <section style={{ ...publicOrgPage.card, padding: 28 }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CalendarDays size={22} color={assocDash.accent} />
                  <h2 style={{ ...publicOrgPage.sectionTitle, margin: 0 }}>Upcoming events</h2>
                </div>
              </div>

              {profile.upcomingEvents.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px 20px',
                    borderRadius: assocDash.radiusMd,
                    background: assocDash.accentMuted,
                    border: `1px dashed ${assocDash.accentBorder}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: assocDash.text }}>
                    No upcoming events published yet.
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: assocDash.muted }}>
                    Check back later for workshops, hackathons, and community gatherings.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 18,
                  }}
                >
                  {profile.upcomingEvents.map((event) => (
                    <PublicOrganizationEventCard
                      key={event.id}
                      organizationId={orgId}
                      event={event}
                    />
                  ))}
                </div>
              )}
            </section>
            <style>{`
              .public-org-follow-spin { animation: public-org-spin 0.8s linear infinite; }
              @keyframes public-org-spin { to { transform: rotate(360deg); } }
            `}</style>
          </>
        ) : (
          <p style={{ color: assocDash.muted }}>Organization not found.</p>
        )}
      </div>
    </div>
  )
}

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function LeadershipMemberCard({ member }: { member: PublicLeadershipTeamMember }) {
  const img = member.imageUrl ? resolveApiFileUrl(member.imageUrl) : null
  const hasLinkedIn = !!member.linkedInUrl?.trim()

  return (
    <article
      style={{
        borderRadius: assocDash.radiusMd,
        border: `1px solid ${assocDash.border}`,
        padding: 18,
        background: assocDash.surface,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 160,
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {img ? (
          <img
            src={img}
            alt=""
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${assocDash.accentBorder}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: assocDash.accentMuted,
              border: `2px solid ${assocDash.accentBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: assocDash.accent,
              flexShrink: 0,
            }}
            aria-hidden
          >
            {member.fullName.trim().charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.25,
              color: assocDash.text,
            }}
          >
            {member.fullName}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: assocDash.accent }}>{member.roleTitle}</p>
        </div>
      </div>
      {member.major?.trim() && (
        <p style={{ margin: 0, fontSize: 13, color: assocDash.muted, lineHeight: 1.45 }}>{member.major}</p>
      )}
      {hasLinkedIn && (
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <a
            href={normalizeExternalUrl(member.linkedInUrl!)}
            target="_blank"
            rel="noopener noreferrer"
            style={leadershipSocialBtn}
            aria-label={`${member.fullName} on LinkedIn`}
          >
            <Linkedin size={16} strokeWidth={2} />
          </a>
        </div>
      )}
    </article>
  )
}

const leadershipSocialBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 10,
  border: `1px solid ${assocDash.border}`,
  background: '#fff',
  color: assocDash.accentDark,
  textDecoration: 'none',
  transition: 'background 0.15s, border-color 0.15s',
}
