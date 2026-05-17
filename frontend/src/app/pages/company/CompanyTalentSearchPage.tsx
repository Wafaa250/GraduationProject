import { useEffect, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Loader2,
  Sparkles,
  User,
  GraduationCap,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import {
  getCompanyProfile,
  searchCompanyTalent,
  parseApiErrorMessage,
  type CompanyTalentCandidate,
  type CompanyTalentSearchResult,
} from '../../../api/companyApi'
import { CompanyDashboardLayout } from './dashboard/CompanyDashboardLayout'
import { coCard, coDash } from './dashboard/companyDashTokens'
import {
  clearTalentSearchState,
  getInitialTalentSearchState,
  saveTalentSearchState,
} from './companyTalentSearchStorage'

const ENGAGEMENT_TYPES = [
  'Internship',
  'Graduation project collaboration',
  'Part-time / freelance',
  'Hackathon or event',
  'Research assistant',
  'Full team for a product sprint',
] as const

const MAJORS = [
  'Computer Science',
  'Software Engineering',
  'Artificial Intelligence',
  'Data Science',
  'Computer Engineering',
  'Electrical Engineering',
  'Information Technology',
]

export default function CompanyTalentSearchPage() {
  const navigate = useNavigate()
  const initial = getInitialTalentSearchState()
  const [companyName, setCompanyName] = useState(localStorage.getItem('name') ?? 'Company')
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>(initial.skills)
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [preferredMajor, setPreferredMajor] = useState(initial.preferredMajor)
  const [engagementType, setEngagementType] = useState(initial.engagementType)
  const [duration, setDuration] = useState(initial.duration)
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<CompanyTalentSearchResult | null>(initial.result)

  useEffect(() => {
    getCompanyProfile()
      .then((p) => setCompanyName(p.companyName))
      .catch(() => {})
  }, [])

  useEffect(() => {
    saveTalentSearchState({
      title,
      description,
      skills,
      preferredMajor,
      engagementType,
      duration,
      result,
    })
  }, [title, description, skills, preferredMajor, engagementType, duration, result])

  const addSkill = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    if (skills.some((s) => s.toLowerCase() === t.toLowerCase())) return
    setSkills((prev) => [...prev, t])
    setSkillInput('')
  }

  const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (skills.length === 0) {
      toast.error('Add at least one required skill')
      return
    }
    if (description.trim().length < 20) {
      toast.error('Please describe the role in more detail')
      return
    }
    setSearching(true)
    try {
      const data = await searchCompanyTalent({
        title: title.trim(),
        description: description.trim(),
        requiredSkills: skills,
        preferredMajor: preferredMajor || undefined,
        engagementType: engagementType || undefined,
        duration: duration.trim() || undefined,
        saveRequest: true,
      })
      setResult(data)
      if (data.candidates.length === 0) toast('No strong matches yet — try broadening skills or major filter.')
      else toast.success(data.usedAi ? 'AI recommendations ready' : 'Matches ready (review suggested)')
    } catch (err) {
      toast.error(parseApiErrorMessage(err))
    } finally {
      setSearching(false)
    }
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
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: coDash.accent }}>AI Talent Search</p>
        <h1 style={{ margin: '6px 0 8px', fontSize: 26, fontWeight: 800, fontFamily: coDash.fontDisplay }}>
          Find the right student
        </h1>
        <p style={{ margin: 0, color: coDash.muted, maxWidth: 560, lineHeight: 1.55 }}>
          Describe who you need. SkillSwap AI ranks students by skills, major, and profile — with a clear
          explanation for every recommendation.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 400px) 1fr',
          gap: 24,
          alignItems: 'start',
        }}
        className="co-talent-grid"
      >
        <form onSubmit={submit} style={{ ...coCard, padding: '28px 28px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>Talent need</h2>

          <label style={labelStyle}>Role title *</label>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. React developer for MVP"
            required
          />

          <label style={labelStyle}>What are you looking for? *</label>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe responsibilities, project context, and what success looks like…"
            required
          />

          <label style={labelStyle}>Required skills *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {skills.map((s) => (
              <span key={s} style={chipStyle}>
                {s}
                <button
                  type="button"
                  onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                  style={chipBtn}
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            style={inputStyle}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={onSkillKey}
            onBlur={() => addSkill(skillInput)}
            placeholder="Type skill and press Enter (React, Python…)"
          />

          <label style={labelStyle}>Engagement type</label>
          <select style={inputStyle} value={engagementType} onChange={(e) => setEngagementType(e.target.value)}>
            <option value="">Any / not specified</option>
            {ENGAGEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Preferred major</label>
          <select style={inputStyle} value={preferredMajor} onChange={(e) => setPreferredMajor(e.target.value)}>
            <option value="">All majors</option>
            {MAJORS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Duration (optional)</label>
          <input
            style={inputStyle}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 3 months, Summer 2026"
          />

          <button
            type="submit"
            disabled={searching}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '14px 20px',
              border: 'none',
              borderRadius: 12,
              background: coDash.aiGradient,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              cursor: searching ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: searching ? 0.85 : 1,
            }}
          >
            {searching ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing candidates…
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Get AI recommendations
              </>
            )}
          </button>
        </form>

        <div style={{ minWidth: 0 }}>
          {!result && !searching && (
            <div
              style={{
                ...coCard,
                padding: 48,
                textAlign: 'center',
                borderStyle: 'dashed',
              }}
            >
              <Sparkles size={40} color={coDash.ai} style={{ marginBottom: 16, opacity: 0.7 }} />
              <p style={{ margin: 0, fontWeight: 700, color: coDash.text }}>Recommendations appear here</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: coDash.muted }}>
                Fill the form and run AI search to see ranked students with match scores and reasons.
              </p>
            </div>
          )}

          {searching && (
            <div style={{ ...coCard, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Loader2 size={22} className="animate-spin" color={coDash.accent} />
                <span style={{ fontWeight: 600 }}>AI is matching students to your need…</span>
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 100,
                    background: '#f1f5f9',
                    borderRadius: 12,
                    marginBottom: 12,
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          )}

          {result && !searching && (
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                    {result.candidates.length} recommended candidate
                    {result.candidates.length !== 1 ? 's' : ''}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: coDash.muted }}>
                    {result.usedAi ? 'Ranked by SkillSwap AI' : 'Ranked by skill overlap'} · {result.title}
                  </p>
                </div>
              </div>

              {result.candidates.length === 0 ? (
                <div style={{ ...coCard, padding: 32, textAlign: 'center' }}>
                  <p style={{ margin: 0, color: coDash.muted }}>
                    No students met the minimum match threshold. Try fewer required skills or remove the major
                    filter.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {result.candidates.map((c, idx) => (
                    <CandidateCard key={c.studentProfileId} candidate={c} rank={idx + 1} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 960px) {
          .co-talent-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </CompanyDashboardLayout>
  )
}

function CandidateCard({ candidate, rank }: { candidate: CompanyTalentCandidate; rank: number }) {
  const navigate = useNavigate()
  const scoreColor =
    candidate.matchScore >= 75 ? '#059669' : candidate.matchScore >= 55 ? '#d97706' : '#64748b'
  const scoreBg =
    candidate.matchScore >= 75 ? '#ecfdf5' : candidate.matchScore >= 55 ? '#fffbeb' : '#f8fafc'

  return (
    <article
      style={{
        ...coCard,
        padding: '22px 24px',
        border: candidate.matchScore >= 75 ? `1.5px solid ${coDash.accentBorder}` : undefined,
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: coDash.gradient,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          #{rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{candidate.name}</h3>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                background: scoreBg,
                color: scoreColor,
                border: `1px solid ${scoreColor}33`,
              }}
            >
              {candidate.matchScore}% match
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: coDash.muted, marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <GraduationCap size={14} />
              {candidate.major || 'Major not set'}
            </span>
            <span>{candidate.university}</span>
            {candidate.academicYear && <span>Year {candidate.academicYear}</span>}
          </div>
          {candidate.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {candidate.skills.slice(0, 8).map((sk) => (
                <span
                  key={sk}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: coDash.accentMuted,
                    color: coDash.accentDark,
                  }}
                >
                  {sk}
                </span>
              ))}
            </div>
          )}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: candidate.highlights.length > 0 ? 12 : 0,
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: coDash.text, marginBottom: 6 }}>
              Why this student?
            </p>
            <p style={{ margin: 0, fontSize: 14, color: coDash.muted, lineHeight: 1.6 }}>{candidate.reason}</p>
          </div>
          {candidate.highlights.length > 0 && (
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: coDash.text, lineHeight: 1.7 }}>
              {candidate.highlights.map((h) => (
                <li key={h} style={{ marginBottom: 4 }}>
                  <CheckCircle2
                    size={14}
                    style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: coDash.accent }}
                  />
                  {h}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => navigate(`/students/profile/${candidate.userId}`)}
            style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${coDash.border}`,
              background: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: coDash.accentDark,
            }}
          >
            <User size={16} />
            View full profile
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
  marginTop: 14,
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 14,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 8,
  background: coDash.accentMuted,
  color: coDash.accentDark,
  fontSize: 12,
  fontWeight: 600,
}

const chipBtn: CSSProperties = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  color: coDash.accent,
  padding: 0,
}
