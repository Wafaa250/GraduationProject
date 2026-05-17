import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  followOrganization,
  getFollowingOrganizations,
  parseApiErrorMessage,
  unfollowOrganization,
  type PublicOrganizationDiscovery,
} from '../../../api/organizationsApi'
import { OrganizationDiscoveryCard } from '../../components/organizations/OrganizationDiscoveryCard'
import { OrganizationsEmptyState } from '../../components/organizations/OrganizationsEmptyState'
import { hub } from '../organizations/organizationHubStyles'
import { publicOrgPage } from '../organizations/publicOrgPageStyles'

export default function StudentFollowingOrganizationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<PublicOrganizationDiscovery[]>([])
  const [loading, setLoading] = useState(true)
  const [followBusyId, setFollowBusyId] = useState<number | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const data = await getFollowingOrganizations()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setItems([])
      toast.error(parseApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const handleFollowToggle = async (org: PublicOrganizationDiscovery, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (followBusyId != null) return
    setFollowBusyId(org.id)
    try {
      await unfollowOrganization(org.id)
      setItems((prev) => prev.filter((o) => o.id !== org.id))
      toast.success('Unfollowed organization')
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setFollowBusyId(null)
    }
  }

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Heart size={22} color="#d97706" fill="#fde68a" />
            <h1 style={{ ...hub.heroTitle, fontSize: 26 }}>Organizations you follow</h1>
          </div>
          <p style={hub.heroSubtitle}>
            Stay connected with the student communities you care about — events, recruitment, and campus updates.
          </p>
        </section>

        <section style={hub.section}>
          <FollowingSectionHeader count={items.length} loading={loading} />

          {loading ? (
            <p style={{ color: '#64748b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={16} className="org-hub-spin" /> Loading…
            </p>
          ) : items.length === 0 ? (
            <OrganizationsEmptyState
              title="You're not following anyone yet"
              message="Follow organizations to stay updated with events and opportunities on campus."
              action={
                <Link to="/organizations" style={hub.ctaBtn}>
                  Discover organizations
                </Link>
              }
            />
          ) : (
            <div style={hub.grid}>
              {items.map((org) => (
                <OrganizationDiscoveryCard
                  key={org.id}
                  org={{ ...org, isFollowing: true }}
                  isStudent
                  followBusy={followBusyId === org.id}
                  onFollowToggle={handleFollowToggle}
                />
              ))}
            </div>
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

function FollowingSectionHeader({ count, loading }: { count: number; loading: boolean }) {
  return (
    <div style={hub.sectionHeader}>
      <div>
        <h2 style={hub.sectionTitle}>Your communities</h2>
        <p style={hub.sectionHint}>
          {loading ? 'Loading…' : `${count} organization${count === 1 ? '' : 's'}`}
        </p>
      </div>
      <Link to="/organizations" style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>
        Discover more
      </Link>
    </div>
  )
}
