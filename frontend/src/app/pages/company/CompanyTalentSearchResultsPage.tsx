import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { getCompanyProfile } from '../../../api/companyApi'
import type { CompanyTalentSearchResult } from '../../../api/companyApi'
import { CompanyDashboardLayout } from './dashboard/CompanyDashboardLayout'
import { coCard, coDash } from './dashboard/companyDashTokens'
import { clearTalentSearchState, loadTalentSearchState } from './companyTalentSearchStorage'
import { CompanyTalentCandidateCard } from './CompanyTalentCandidateCard'

export default function CompanyTalentSearchResultsPage() {
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState(localStorage.getItem('name') ?? 'Company')
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [result] = useState<CompanyTalentSearchResult | null>(() => loadTalentSearchState()?.result ?? null)

  useEffect(() => {
    getCompanyProfile()
      .then((p) => setCompanyName(p.companyName))
      .catch(() => {})
  }, [])

  if (!result) {
    return <Navigate to="/company/talent-search" replace />
  }

  return (
    <CompanyDashboardLayout
      companyName={companyName}
      sidebarMobileOpen={sidebarMobileOpen}
      onSidebarOpen={() => setSidebarMobileOpen(true)}
      onSidebarClose={() => setSidebarMobileOpen(false)}
      onLogout={() => {
        clearTalentSearchState()
        localStorage.clear()
        navigate('/login')
      }}
    >
      <div className="co-results-wrap">
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/company/talent-search"
          className="co-results-back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
            color: coDash.accentDark,
            textDecoration: 'none',
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={18} />
          Back to search
        </Link>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: coDash.accent }}>AI Talent Search</p>
        <h1 style={{ margin: '6px 0 8px', fontSize: 26, fontWeight: 800, fontFamily: coDash.fontDisplay }}>
          Recommended students
        </h1>
        <p style={{ margin: 0, color: coDash.muted, maxWidth: 640, lineHeight: 1.55 }}>
          {result.usedAi ? 'Ranked by SkillSwap AI' : 'Ranked by skill overlap'} · {result.title}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <Sparkles size={22} color={coDash.ai} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
          {result.candidates.length} recommended candidate{result.candidates.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {result.candidates.length === 0 ? (
        <div style={{ ...coCard, padding: 32, textAlign: 'center' }}>
          <p style={{ margin: 0, color: coDash.muted }}>
            No students met the minimum match threshold. Try fewer required skills or remove the major filter.
          </p>
          <Link
            to="/company/talent-search"
            style={{
              display: 'inline-block',
              marginTop: 20,
              fontWeight: 700,
              color: coDash.accentDark,
            }}
          >
            Adjust search
          </Link>
        </div>
      ) : (
        <div className="co-results-list" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
          {result.candidates.map((c, idx) => (
            <CompanyTalentCandidateCard key={c.studentProfileId} candidate={c} rank={idx + 1} />
          ))}
        </div>
      )}
      </div>
    </CompanyDashboardLayout>
  )
}
