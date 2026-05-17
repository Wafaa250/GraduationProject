import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Loader2,
  Megaphone,
  Radio,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  followOrganization,
  getFollowingOrganizations,
  listPublicOrganizationsForDiscovery,
  parseApiErrorMessage,
  unfollowOrganization,
  type PublicOrganizationDiscovery,
} from '../../../api/organizationsApi'
import {
  loadCommunityFeed,
  type CommunityFeedPayload,
} from '../../../api/communitiesFeedApi'
import { CommunitiesFeedEmptyState } from '../../components/communities/feed/CommunitiesFeedEmptyState'
import { CommunityEventFeedCard } from '../../components/communities/feed/CommunityEventFeedCard'
import { CommunityRecruitmentFeedCard } from '../../components/communities/feed/CommunityRecruitmentFeedCard'
import { FollowingActivityCard } from '../../components/communities/feed/FollowingActivityCard'
import { SuggestedCommunityCard } from '../../components/communities/feed/SuggestedCommunityCard'
import { feed, feedPageStyles } from './communitiesFeedStyles'
import { hub } from './communitiesHubStyles'
import { publicOrgPage } from '../organizations/publicOrgPageStyles'
import { assocDash } from '../association/dashboard/associationDashTokens'

const isStudentRole = () => (localStorage.getItem('role') ?? '').toLowerCase() === 'student'

const emptyFeed: CommunityFeedPayload = { events: [], recruitment: [], activity: [] }

function FeedLoadingRow() {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 14,
        color: assocDash.muted,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 0',
      }}
    >
      <Loader2 size={18} className="org-hub-spin" />
      Loading from campus organizations…
    </p>
  )
}

export default function CommunitiesHubPage() {
  const navigate = useNavigate()
  const isStudent = isStudentRole()
  const [organizations, setOrganizations] = useState<PublicOrganizationDiscovery[]>([])
  const [following, setFollowing] = useState<PublicOrganizationDiscovery[]>([])
  const [feedData, setFeedData] = useState<CommunityFeedPayload>(emptyFeed)
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [followBusyId, setFollowBusyId] = useState<number | null>(null)

  const reloadFeed = useCallback(
    async (orgList: PublicOrganizationDiscovery[], followList: PublicOrganizationDiscovery[]) => {
      setFeedLoading(true)
      try {
        const payload = await loadCommunityFeed(orgList, followList)
        setFeedData(payload)
      } catch {
        setFeedData(emptyFeed)
      } finally {
        setFeedLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [all, followed] = await Promise.all([
          listPublicOrganizationsForDiscovery(),
          isStudent ? getFollowingOrganizations() : Promise.resolve([]),
        ])
        if (cancelled) return
        const orgList = Array.isArray(all) ? all : []
        const followList = Array.isArray(followed) ? followed : []
        setOrganizations(orgList)
        setFollowing(followList)
        setOrgsLoading(false)
        await reloadFeed(orgList, followList)
      } catch {
        if (!cancelled) {
          setOrganizations([])
          setFollowing([])
          setFeedData(emptyFeed)
          setOrgsLoading(false)
          setFeedLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isStudent, reloadFeed])

  const categories = useMemo(() => {
    const set = new Set<string>()
    organizations.forEach((o) => {
      if (o.category?.trim()) set.add(o.category.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [organizations])

  const suggested = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...organizations]
      .filter((org) => {
        if (categoryFilter && (org.category ?? '') !== categoryFilter) return false
        if (!q) return true
        const name = (org.organizationName ?? '').toLowerCase()
        const user = (org.username ?? '').toLowerCase()
        return (
          name.includes(q) ||
          user.includes(q) ||
          (org.shortDescription ?? '').toLowerCase().includes(q) ||
          (org.category ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0))
  }, [organizations, search, categoryFilter])

  const patchOrg = (id: number, isFollowing: boolean, delta: number) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, isFollowing, followersCount: Math.max(0, (o.followersCount ?? 0) + delta) }
          : o,
      ),
    )
    setFollowing((prev) => {
      const org = organizations.find((o) => o.id === id)
      if (!org) return prev
      const updated = {
        ...org,
        isFollowing,
        followersCount: Math.max(0, (org.followersCount ?? 0) + delta),
      }
      if (isFollowing) {
        if (prev.some((p) => p.id === id)) {
          return prev.map((p) => (p.id === id ? updated : p))
        }
        return [...prev, updated]
      }
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleFollowToggle = useCallback(
    async (org: PublicOrganizationDiscovery, e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isStudent || followBusyId != null) return
      setFollowBusyId(org.id)
      try {
        if (org.isFollowing) {
          await unfollowOrganization(org.id)
          patchOrg(org.id, false, -1)
        } else {
          await followOrganization(org.id)
          patchOrg(org.id, true, 1)
        }
        const nextFollowing = org.isFollowing
          ? following.filter((f) => f.id !== org.id)
          : [...following, { ...org, isFollowing: true, followersCount: (org.followersCount ?? 0) + 1 }]
        const nextOrgs = organizations.map((o) =>
          o.id === org.id
            ? {
                ...o,
                isFollowing: !org.isFollowing,
                followersCount: Math.max(0, (o.followersCount ?? 0) + (org.isFollowing ? -1 : 1)),
              }
            : o,
        )
        await reloadFeed(nextOrgs, nextFollowing)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
      } finally {
        setFollowBusyId(null)
      }
    },
    [isStudent, followBusyId, organizations, following, reloadFeed],
  )

  return (
    <div style={hub.page}>
      <nav style={publicOrgPage.nav}>
        <div style={{ ...publicOrgPage.navInner, maxWidth: 1040, margin: '0 auto' }}>
          <button type="button" onClick={() => navigate(-1)} style={publicOrgPage.backBtn}>
            <ArrowLeft size={14} />
            Back
          </button>
          <span style={publicOrgPage.logoText}>
            Skill<span style={publicOrgPage.logoAccent}>Swap</span>
          </span>
        </div>
      </nav>

      <div style={hub.shell}>
        <header style={feed.header}>
          <h1 style={feed.title}>Communities</h1>
          <p style={feed.subtitle}>
            Discover campus organizations, upcoming events, recruitment, and updates from communities you follow.
          </p>
        </header>

        <div style={hub.toolbar}>
          <div style={hub.searchWrap}>
            <Search size={16} color="#64748b" />
            <input
              type="search"
              placeholder="Search organizations, categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={hub.searchInput}
            />
          </div>
        </div>

        <div style={hub.chipRow}>
          <button
            type="button"
            style={hub.chip(!categoryFilter)}
            onClick={() => setCategoryFilter('')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              style={hub.chip(categoryFilter === c)}
              onClick={() => setCategoryFilter(categoryFilter === c ? '' : c)}
            >
              {c}
            </button>
          ))}
        </div>

        <FeedSection
          icon={<Sparkles size={18} color={assocDash.accent} />}
          title="Suggested communities"
          hint="Organizations from your campus directory"
          action={
            <Link to="/organizations" style={{ fontSize: 13, fontWeight: 600, color: assocDash.accentDark }}>
              Explore all
            </Link>
          }
        >
          {orgsLoading ? (
            <FeedLoadingRow />
          ) : organizations.length === 0 ? (
            <CommunitiesFeedEmptyState
              icon={<Building2 size={28} />}
              title="No organizations yet"
              message="When student organizations join SkillSwap, they will appear here for you to discover and follow."
            />
          ) : suggested.length === 0 ? (
            <CommunitiesFeedEmptyState
              icon={<Search size={28} />}
              title="No matches"
              message="Try a different search term or category filter."
            />
          ) : (
            <div style={hub.horizontalRow}>
              {suggested.map((org) => (
                <div key={org.id} style={feed.horizontalCard}>
                  <SuggestedCommunityCard
                    org={org}
                    isStudent={isStudent}
                    followBusy={followBusyId === org.id}
                    onFollowToggle={handleFollowToggle}
                  />
                </div>
              ))}
            </div>
          )}
        </FeedSection>

        <FeedSection
          icon={<CalendarDays size={18} color="#2563eb" />}
          title="Upcoming events"
          hint="Live events published by student organizations"
        >
          {feedLoading ? (
            <FeedLoadingRow />
          ) : feedData.events.length === 0 ? (
            <CommunitiesFeedEmptyState
              icon={<CalendarDays size={28} />}
              title="No upcoming events"
              message="Organizations have not published any upcoming events yet. Check back soon or follow communities for updates."
              action={
                <Link to="/organizations" style={{ ...hub.ctaBtn, marginTop: 16 }}>
                  Browse organizations
                </Link>
              }
            />
          ) : (
            <div style={hub.horizontalRow}>
              {feedData.events.map((event) => (
                <div key={`${event.organizationId}-${event.id}`} style={feed.horizontalCard}>
                  <CommunityEventFeedCard event={event} />
                </div>
              ))}
            </div>
          )}
        </FeedSection>

        <FeedSection
          icon={<Megaphone size={18} color="#7c3aed" />}
          title="Recruitment opportunities"
          hint="Open campaigns from campus organizations"
        >
          {feedLoading ? (
            <FeedLoadingRow />
          ) : feedData.recruitment.length === 0 ? (
            <CommunitiesFeedEmptyState
              icon={<Megaphone size={28} />}
              title="No open recruitment"
              message="There are no published recruitment campaigns with open deadlines right now."
              action={
                <Link to="/organizations" style={{ ...hub.ctaBtn, marginTop: 16 }}>
                  Browse organizations
                </Link>
              }
            />
          ) : (
            <div style={feed.compactGrid}>
              {feedData.recruitment.map((item) => (
                <CommunityRecruitmentFeedCard key={`${item.organizationId}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </FeedSection>

        {isStudent && (
          <FeedSection
            icon={<Radio size={18} color={assocDash.accent} />}
            title="Following activity"
            hint={
              following.length > 0
                ? 'Latest events and recruitment from organizations you follow'
                : 'Follow organizations to see their updates here'
            }
            action={
              following.length > 0 ? (
                <Link to="/following" style={{ fontSize: 13, fontWeight: 600, color: assocDash.accentDark }}>
                  Manage following
                </Link>
              ) : (
                <Link to="/organizations" style={{ fontSize: 13, fontWeight: 600, color: assocDash.accentDark }}>
                  Discover orgs
                </Link>
              )
            }
          >
            {feedLoading && following.length > 0 ? (
              <FeedLoadingRow />
            ) : following.length === 0 ? (
              <CommunitiesFeedEmptyState
                icon={<Users size={28} />}
                title="Nothing in your feed yet"
                message="Follow student organizations to see their new events and recruitment here."
                action={
                  <Link to="/organizations" style={{ ...hub.ctaBtn, marginTop: 16 }}>
                    Discover organizations
                  </Link>
                }
              />
            ) : feedData.activity.length === 0 ? (
              <CommunitiesFeedEmptyState
                icon={<Radio size={28} />}
                title="No recent activity"
                message="Organizations you follow have not posted new events or recruitment recently."
                action={
                  <Link to="/following" style={{ ...hub.ctaBtn, marginTop: 16 }}>
                    View following
                  </Link>
                }
              />
            ) : (
              <div style={feed.activityList}>
                {feedData.activity.map((item) => (
                  <FollowingActivityCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </FeedSection>
        )}
      </div>

      <style>{feedPageStyles}</style>
    </div>
  )
}

function FeedSection({
  icon,
  title,
  hint,
  action,
  children,
}: {
  icon: ReactNode
  title: string
  hint: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section style={feed.section}>
      <div style={hub.sectionHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <div>
            <h2 style={hub.sectionTitle}>{title}</h2>
            <p style={hub.sectionHint}>{hint}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
