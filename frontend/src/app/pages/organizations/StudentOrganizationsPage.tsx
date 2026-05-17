import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Search, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  followOrganization,
  getFollowingOrganizations,
  listPublicOrganizationsForDiscovery,
  parseApiErrorMessage,
  unfollowOrganization,
  type PublicOrganizationDiscovery,
} from '../../../api/organizationsApi'
import { OrganizationDiscoveryCard } from '../../components/organizations/OrganizationDiscoveryCard'
import { OrganizationsEmptyState } from '../../components/organizations/OrganizationsEmptyState'
import { publicOrgPage } from './publicOrgPageStyles'
import { hub } from './organizationHubStyles'

const isStudentRole = () => (localStorage.getItem('role') ?? '').toLowerCase() === 'student'

export default function StudentOrganizationsPage() {
  const navigate = useNavigate()
  const isStudent = isStudentRole()
  const [organizations, setOrganizations] = useState<PublicOrganizationDiscovery[]>([])
  const [following, setFollowing] = useState<PublicOrganizationDiscovery[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [followBusyId, setFollowBusyId] = useState<number | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const [all, followed] = await Promise.all([
        listPublicOrganizationsForDiscovery(),
        isStudent ? getFollowingOrganizations() : Promise.resolve([]),
      ])
      setOrganizations(Array.isArray(all) ? all : [])
      setFollowing(Array.isArray(followed) ? followed : [])
    } catch (err) {
      setOrganizations([])
      setFollowing([])
      toast.error(parseApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [isStudent])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const categories = useMemo(() => {
    const set = new Set<string>()
    organizations.forEach((o) => {
      if (o.category?.trim()) set.add(o.category.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [organizations])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return organizations.filter((org) => {
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
  }, [organizations, search, categoryFilter])

  const suggested = useMemo(() => {
    const pool = organizations.filter((o) => !o.isFollowing)
    return [...pool]
      .sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0))
      .slice(0, 4)
  }, [organizations])

  const patchOrg = (id: number, isFollowing: boolean, delta: number) => {
    const map = (list: PublicOrganizationDiscovery[]) =>
      list.map((o) =>
        o.id === id
          ? { ...o, isFollowing, followersCount: Math.max(0, (o.followersCount ?? 0) + delta) }
          : o,
      )
    setOrganizations((prev) => {
      const next = map(prev)
      const org = next.find((o) => o.id === id)
      if (org) {
        setFollowing((fPrev) => {
          if (isFollowing) {
            if (fPrev.some((p) => p.id === id)) return map(fPrev)
            return [...fPrev, org].sort((a, b) => a.organizationName.localeCompare(b.organizationName))
          }
          return fPrev.filter((p) => p.id !== id)
        })
      }
      return next
    })
  }

  const handleFollowToggle = async (org: PublicOrganizationDiscovery, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isStudent || followBusyId != null) return
    setFollowBusyId(org.id)
    try {
      if (org.isFollowing) {
        await unfollowOrganization(org.id)
        patchOrg(org.id, false, -1)
        toast.success('Unfollowed organization')
      } else {
        await followOrganization(org.id)
        patchOrg(org.id, true, 1)
        toast.success('Now following organization')
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setFollowBusyId(null)
    }
  }

  const renderCard = (org: PublicOrganizationDiscovery, compact?: boolean) => (
    <OrganizationDiscoveryCard
      key={org.id}
      org={org}
      isStudent={isStudent}
      followBusy={followBusyId === org.id}
      onFollowToggle={handleFollowToggle}
      compact={compact}
    />
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
        <section style={hub.hero}>
          <div style={hub.heroGlow} />
          <h1 style={hub.heroTitle}>Discover Student Communities</h1>
          <p style={hub.heroSubtitle}>
            Follow organizations, explore events, recruitment opportunities, and campus activities.
          </p>
        </section>

        {!loading && isStudent && following.length > 0 && (
          <section style={hub.section}>
            <div style={hub.sectionHeader}>
              <div>
                <h2 style={hub.sectionTitle}>Following</h2>
                <p style={hub.sectionHint}>Organizations you&apos;re connected with</p>
              </div>
              <Link to="/following" style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>
                View all
              </Link>
            </div>
            <div style={hub.horizontalRow}>
              {following.map((org) => (
                <div key={org.id} style={hub.horizontalCardWrap}>
                  {renderCard(org, true)}
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && suggested.length > 0 && (
          <section style={hub.section}>
            <SuggestedSectionHeader />
            <div style={hub.grid}>{suggested.map((org) => renderCard(org))}</div>
          </section>
        )}

        <section style={hub.section}>
          <div style={hub.sectionHeader}>
            <div>
              <h2 style={hub.sectionTitle}>Discover organizations</h2>
              <p style={hub.sectionHint}>Browse campus clubs and student associations</p>
            </div>
          </div>

          <div style={hub.toolbar}>
            <div style={hub.searchWrap}>
              <Search size={16} color="#64748b" />
              <input
                type="search"
                placeholder="Search by name, category, or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={hub.searchInput}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={hub.select}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {categories.length > 0 && (
            <div style={hub.chipRow}>
              <button type="button" style={hub.chip(!categoryFilter)} onClick={() => setCategoryFilter('')}>
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={hub.chip(categoryFilter === c)}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p style={{ color: '#64748b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} className="org-hub-spin" /> Loading communities…
            </p>
          ) : organizations.length === 0 ? (
            <OrganizationsEmptyState
              title="No organizations yet"
              message="Student organizations will appear here once they join SkillSwap. Check back soon for campus communities."
            />
          ) : filtered.length === 0 ? (
            <OrganizationsEmptyState
              title="No matches found"
              message="Try a different search term or clear your category filter to see more communities."
              action={
                <button type="button" style={hub.ctaBtn} onClick={() => { setSearch(''); setCategoryFilter('') }}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div style={hub.grid}>{filtered.map((org) => renderCard(org))}</div>
          )}
        </section>
      </div>

      <style>{`
        .org-hub-card:hover {
          transform: translateY(-3px);
          border-color: #fde68a;
          box-shadow: 0 12px 32px rgba(15,23,42,0.1);
        }
        @keyframes org-hub-spin { to { transform: rotate(360deg); } }
        .org-hub-spin { animation: org-hub-spin 0.8s linear infinite; }
      `}</style>
    </div>
  )
}

function SuggestedSectionHeader() {
  return (
    <div style={hub.sectionHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={18} color="#d97706" />
        <div>
          <h2 style={hub.sectionTitle}>Suggested for you</h2>
          <p style={hub.sectionHint}>Popular communities on campus</p>
        </div>
      </div>
    </div>
  )
}
