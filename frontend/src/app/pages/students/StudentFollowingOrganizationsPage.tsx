import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getFollowedOrganizations,
  parseApiErrorMessage,
  type PublicOrganizationListItem,
} from '../../../api/organizationsApi'
import { AssociationAvatar, CategoryBadge, VerifiedBadge } from '../../components/association/associationBrand'
import { assocDash } from '../association/dashboard/associationDashTokens'
import { publicOrgPage } from '../organizations/publicOrgPageStyles'

export default function StudentFollowingOrganizationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<PublicOrganizationListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getFollowedOrganizations()
        if (!cancelled) setItems(data)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Building2 size={28} color={assocDash.accent} />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                fontFamily: assocDash.fontDisplay,
                color: assocDash.text,
              }}
            >
              Organizations you follow
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: assocDash.muted }}>
              Student Organizations you follow on SkillSwap
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: assocDash.muted, fontSize: 14 }}>Loading…</p>
        ) : items.length === 0 ? (
          <div style={{ ...publicOrgPage.card, padding: 40, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: assocDash.text }}>
              You are not following any Student Organizations yet.
            </p>
            <p style={{ margin: '10px 0 0', fontSize: 13, color: assocDash.muted }}>
              Open a public organization profile and tap Follow to get updates when they post events.
            </p>
            <Link
              to="/students"
              style={{
                display: 'inline-block',
                marginTop: 18,
                fontSize: 13,
                fontWeight: 600,
                color: assocDash.accentDark,
              }}
            >
              Explore from student home
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
              marginTop: 24,
            }}
          >
            {items.map((org) => (
              <Link
                key={org.id}
                to={`/organizations/${org.id}`}
                style={{
                  ...publicOrgPage.card,
                  padding: 20,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
                className="following-org-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <AssociationAvatar name={org.name} logoUrl={org.logoUrl} size="md" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        fontFamily: assocDash.fontDisplay,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {org.name}
                    </p>
                    {org.faculty && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: assocDash.muted }}>{org.faculty}</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {org.category && <CategoryBadge category={org.category} />}
                      {org.isVerified && <VerifiedBadge />}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <style>{`
          .following-org-card:hover {
            border-color: ${assocDash.accentBorder};
            box-shadow: 0 8px 24px rgba(15,23,42,0.08);
          }
        `}</style>
      </div>
    </div>
  )
}
