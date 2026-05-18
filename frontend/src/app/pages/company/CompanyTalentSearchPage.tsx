import { useEffect, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, Sparkles } from 'lucide-react'
import { getCompanyProfile, searchCompanyTalent, parseApiErrorMessage } from '../../../api/companyApi'
import { CompanyDashboardLayout } from './dashboard/CompanyDashboardLayout'
import { coCard, coDash } from './dashboard/companyDashTokens'
import {
  clearTalentSearchState,
  getInitialTalentSearchState,
  loadTalentSearchState,
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

  useEffect(() => {
    getCompanyProfile()
      .then((p) => setCompanyName(p.companyName))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const prev = loadTalentSearchState()
    saveTalentSearchState({
      title,
      description,
      skills,
      preferredMajor,
      engagementType,
      duration,
      result: prev?.result ?? null,
    })
  }, [title, description, skills, preferredMajor, engagementType, duration])

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
      saveTalentSearchState({
        title: title.trim(),
        description: description.trim(),
        skills,
        preferredMajor,
        engagementType,
        duration,
        result: data,
      })
      if (data.candidates.length === 0) toast('No strong matches yet — try broadening skills or major filter.')
      else toast.success(data.usedAi ? 'Opening your recommendations…' : 'Opening matches…')
      navigate('/company/talent-search/results')
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
      <div className="co-talent-page" style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: coDash.accent }}>AI Talent Search</p>
        <h1 style={{ margin: '6px 0 8px', fontSize: 26, fontWeight: 800, fontFamily: coDash.fontDisplay }}>
          Find the right student
        </h1>
        <p style={{ margin: 0, color: coDash.muted, maxWidth: 560, lineHeight: 1.55 }}>
          Describe who you need. SkillSwap AI ranks students by skills, major, and profile — with a clear
          explanation for every recommendation.
        </p>
      </div>

      <div style={{ maxWidth: 480 }} className="co-talent-form-wrap">
        <form onSubmit={submit} className="co-talent-form" style={{ ...coCard, padding: '28px 28px' }}>
          <h2 className="co-talent-heading" style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>
            Talent need
          </h2>

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
              <span key={s} className="co-talent-chip" style={chipStyle}>
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
            className="co-talent-submit"
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
      </div>
    </CompanyDashboardLayout>
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
