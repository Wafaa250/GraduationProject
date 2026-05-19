import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Loader2, Users } from 'lucide-react'
import {
  listMyStudentOrganizationMemberships,
  parseApiErrorMessage,
  type StudentOrganizationMembership,
} from '../../../api/organizationMembersApi'
import { AssociationAvatar } from '../association/associationBrand'

type Props = {
  /** Inline styles from profile page */
  cardStyle?: React.CSSProperties
  titleStyle?: React.CSSProperties
  mutedStyle?: React.CSSProperties
}

export function StudentOrganizationMembershipsSection({ cardStyle, titleStyle, mutedStyle }: Props) {
  const [items, setItems] = useState<StudentOrganizationMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await listMyStudentOrganizationMemberships()
        if (!cancelled) setItems(data)
      } catch (err) {
        if (!cancelled) setError(parseApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div style={cardStyle}>
        <p style={{ ...mutedStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={16} className="student-org-spin" /> Loading organizations…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, color: '#b91c1c', fontSize: 14 }}>{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>Organizations</h3>
        <p style={{ margin: '8px 0 0', ...mutedStyle }}>
          When you are accepted through recruitment, your memberships will appear here.
        </p>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>Organizations you joined</h3>
      <p style={{ margin: '8px 0 16px', ...mutedStyle }}>
        Official memberships from accepted recruitment applications.
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((m) => (
          <article
            key={m.organizationMemberId}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <AssociationAvatar name={m.organizationName} logoUrl={m.organizationLogoUrl} size="sm" />
              <div style={{ minWidth: 0 }}>
                <Link
                  to={`/organizations/${m.organizationId}`}
                  style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', textDecoration: 'none' }}
                >
                  {m.organizationName}
                </Link>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#ea580c', fontWeight: 600 }}>
                  {m.roleTitle}
                </p>
                {m.campaignTitle ? (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{m.campaignTitle}</p>
                ) : null}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={kindBadge(m.membershipKind)}>
                {m.membershipKind === 'Leadership' ? (
                  <>
                    <Users size={12} /> Leadership
                  </>
                ) : (
                  <>
                    <Building2 size={12} /> Member
                  </>
                )}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Joined {new Date(m.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </article>
        ))}
      </div>
      <style>{`@keyframes student-org-spin { to { transform: rotate(360deg); } } .student-org-spin { animation: student-org-spin 0.8s linear infinite; }`}</style>
    </div>
  )
}

function kindBadge(kind: string): React.CSSProperties {
  const leadership = kind === 'Leadership'
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    background: leadership ? '#fff7ed' : '#ecfdf5',
    color: leadership ? '#c2410c' : '#047857',
    border: leadership ? '1px solid #fed7aa' : '1px solid #86efac',
  }
}
