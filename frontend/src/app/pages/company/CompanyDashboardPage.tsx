import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCompanyProfile,
  listCompanyTalentRequests,
  parseApiErrorMessage,
  type CompanyProfile,
  type CompanyTalentRequestSummary,
} from '../../../api/companyApi'
import { clearTalentSearchState } from './companyTalentSearchStorage'
import { CompanyDashboardLayout } from './dashboard/CompanyDashboardLayout'
import { coCard, coDash } from './dashboard/companyDashTokens'

export default function CompanyDashboardPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [requests, setRequests] = useState<CompanyTalentRequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const p = await getCompanyProfile()
        if (!cancelled) setProfile(p)
      } catch (err) {
        toast.error(parseApiErrorMessage(err))
      }

      try {
        const r = await listCompanyTalentRequests()
        if (!cancelled) setRequests(r)
      } catch {
        if (!cancelled) setRequests([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const name = profile?.companyName ?? localStorage.getItem('name') ?? 'Company'

  return (
    <CompanyDashboardLayout
      companyName={name}
      sidebarMobileOpen={sidebarMobileOpen}
      onSidebarOpen={() => setSidebarMobileOpen(true)}
      onSidebarClose={() => setSidebarMobileOpen(false)}
      onLogout={() => {
        clearTalentSearchState()
        localStorage.clear()
        navigate('/login')
      }}
    >
      {loading ? (
        <p style={{ color: coDash.muted }}>Loading…</p>
      ) : (
        <>
          <section
            style={{
              ...coCard,
              padding: '32px 36px',
              marginBottom: 24,
              background: `linear-gradient(135deg, ${coDash.accentMuted} 0%, #fff 60%)`,
              borderColor: coDash.accentBorder,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: coDash.accent }}>Company workspace</p>
            <h1
              style={{
                margin: '8px 0 12px',
                fontSize: 28,
                fontWeight: 800,
                fontFamily: coDash.fontDisplay,
              }}
            >
              Welcome, {name}
            </h1>
            <p style={{ margin: '0 0 24px', color: coDash.muted, maxWidth: 520, lineHeight: 1.6 }}>
              Describe the student profile you need — our AI analyzes skills and backgrounds across the
              university and recommends the best matches with clear explanations.
            </p>
            <Link
              to="/company/talent-search"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 12,
                background: coDash.gradient,
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              }}
            >
              <Sparkles size={18} />
              Start AI talent search
              <ArrowRight size={16} />
            </Link>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard icon={<Building2 size={20} />} label="Industry" value={profile?.industry ?? '—'} />
            <StatCard icon={<Sparkles size={20} />} label="Recent searches" value={String(requests.length)} />
          </div>

          <section style={{ ...coCard, padding: '24px 28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Recent talent searches</h2>
            {requests.length === 0 ? (
              <p style={{ color: coDash.muted, margin: 0 }}>No searches yet. Create your first AI talent search.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {requests.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: `1px solid ${coDash.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: coDash.text }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: coDash.muted, marginTop: 4 }}>
                        {r.engagementType && <span>{r.engagementType} · </span>}
                        {r.requiredSkills.slice(0, 4).join(', ')}
                        {r.requiredSkills.length > 4 ? '…' : ''}
                      </div>
                    </div>
                    <time style={{ fontSize: 12, color: coDash.subtle }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </CompanyDashboardLayout>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div style={{ ...coCard, padding: '20px 22px' }}>
      <div style={{ color: coDash.accent, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: coDash.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
    </div>
  )
}
