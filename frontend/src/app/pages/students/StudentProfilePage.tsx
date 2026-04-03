import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Github, Linkedin, Globe, Star,
  GraduationCap, MapPin, BookOpen, Zap, Wrench, Languages
} from 'lucide-react'
import api from '../../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentProfile {
  userId:               number
  profileId:            number
  name:                 string
  email:                string
  studentId:            string
  university:           string
  faculty:              string
  major:                string
  academicYear:         string
  gpa:                  number | null
  bio:                  string
  availability:         string
  lookingFor:           string
  github:               string
  linkedin:             string
  portfolio:            string
  profilePictureBase64: string | null
  languages:            string[]
  roles:                string[]
  technicalSkills:      string[]
  tools:                string[]
  matchScore:           number | null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate   = useNavigate()

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    api.get(`/students/${userId}`)
      .then(res => setProfile(res.data))
      .catch(err => {
        const msg = err?.response?.status === 403
          ? 'You do not have permission to view this profile.'
          : err?.response?.data?.message || 'Student not found.'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [userId])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.page}>
      <div style={S.centered}>
        <div style={S.spinner} />
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 14 }}>Loading profile...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !profile) return (
    <div style={S.page}>
      <div style={S.centered}>
        <span style={{ fontSize: 40 }}>😕</span>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', margin: '10px 0 6px' }}>
          {error || 'Profile not found'}
        </p>
        <button onClick={() => navigate('/students')} style={S.backBtn}>
          <ArrowLeft size={14} /> Back to Students
        </button>
      </div>
    </div>
  )

  const initials = profile.name
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const scoreColor =
    (profile.matchScore ?? 0) >= 70 ? '#16a34a' :
    (profile.matchScore ?? 0) >= 40 ? '#d97706' : '#64748b'

  const allSkills = [...(profile.roles || []), ...(profile.technicalSkills || [])]

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <button onClick={() => navigate(-1)} style={S.backBtn}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={S.navLogo}>
            <div style={S.logoIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
          </div>
          <Link to="/students" style={{ ...S.backBtn, marginLeft: 'auto', textDecoration: 'none' }}>
            Browse Students
          </Link>
        </div>
      </nav>

      <div style={S.content}>
        <div style={S.twoCol}>

          {/* ── LEFT — Profile Card ── */}
          <div style={S.leftCol}>

            {/* Avatar + basic */}
            <div style={S.profileCard}>

              {/* Match score */}
              {profile.matchScore !== null && profile.matchScore > 0 && (
                <div style={{ ...S.matchBadge, color: scoreColor }}>
                  <Star size={12} fill={scoreColor} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{profile.matchScore}% match</span>
                </div>
              )}

              {/* Avatar */}
              <div style={S.avatarWrap}>
                {profile.profilePictureBase64 ? (
                  <img
                    src={profile.profilePictureBase64}
                    alt={profile.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: '50%' }}
                  />
                ) : (
                  <div style={S.avatarFallback}>{initials}</div>
                )}
              </div>

              <h1 style={S.name}>{profile.name}</h1>

              {/* Academic info pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, justifyContent: 'center', marginBottom: 14 }}>
                {profile.major && (
                  <span style={S.pill}><GraduationCap size={11} /> {profile.major}</span>
                )}
                {profile.academicYear && (
                  <span style={S.pill}><BookOpen size={11} /> {profile.academicYear}</span>
                )}
                {profile.university && (
                  <span style={S.pill}><MapPin size={11} /> {profile.university}</span>
                )}
                {profile.gpa && (
                  <span style={{ ...S.pill, background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                    GPA {profile.gpa}
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p style={S.bio}>{profile.bio}</p>
              )}

              {/* Availability / Looking for */}
              {(profile.availability || profile.lookingFor) && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 14 }}>
                  {profile.availability && (
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>⏱ Availability</span>
                      <span style={S.infoVal}>{profile.availability}</span>
                    </div>
                  )}
                  {profile.lookingFor && (
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>🎯 Looking for</span>
                      <span style={S.infoVal}>{profile.lookingFor}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Social links */}
              <div style={{ display: 'flex', gap: 8 }}>
                {profile.github && (
                  <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                    target="_blank" rel="noopener noreferrer" style={S.socialBtn}>
                    <Github size={14} /> GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank" rel="noopener noreferrer" style={{ ...S.socialBtn, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                    <Linkedin size={14} /> LinkedIn
                  </a>
                )}
                {profile.portfolio && (
                  <a href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`}
                    target="_blank" rel="noopener noreferrer" style={{ ...S.socialBtn, background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                    <Globe size={14} /> Portfolio
                  </a>
                )}
              </div>

            </div>

            {/* Languages */}
            {profile.languages?.length > 0 && (
              <div style={S.card}>
                <h3 style={S.sectionTitle}><Languages size={14} /> Languages</h3>
                <div style={S.chipRow}>
                  {profile.languages.map(l => (
                    <span key={l} style={S.langChip}>{l}</span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT — Skills ── */}
          <div style={S.rightCol}>

            {/* Roles */}
            {profile.roles?.length > 0 && (
              <div style={S.card}>
                <h3 style={S.sectionTitle}><Star size={14} color="#6366f1" /> Specializations</h3>
                <div style={S.chipRow}>
                  {profile.roles.map(r => (
                    <span key={r} style={S.roleChip}>{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills */}
            {profile.technicalSkills?.length > 0 && (
              <div style={S.card}>
                <h3 style={S.sectionTitle}><Zap size={14} color="#a855f7" /> Technical Skills</h3>
                <div style={S.chipRow}>
                  {profile.technicalSkills.map(s => (
                    <span key={s} style={{ ...S.roleChip, background: '#faf5ff', color: '#a855f7', borderColor: '#e9d5ff' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {profile.tools?.length > 0 && (
              <div style={S.card}>
                <h3 style={S.sectionTitle}><Wrench size={14} color="#0891b2" /> Tools & Technologies</h3>
                <div style={S.chipRow}>
                  {profile.tools.map(t => (
                    <span key={t} style={{ ...S.roleChip, background: '#ecfeff', color: '#0891b2', borderColor: '#a5f3fc' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Match breakdown */}
            {profile.matchScore !== null && profile.matchScore > 0 && (
              <div style={{ ...S.card, background: 'linear-gradient(135deg,rgba(99,102,241,0.04),rgba(168,85,247,0.04))', border: '1px solid rgba(99,102,241,0.15)' }}>
                <h3 style={S.sectionTitle}><Star size={14} color="#6366f1" /> AI Match Score</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${profile.matchScore}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 4, transition: 'width 0.8s ease' }} />
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor, minWidth: 48 }}>
                    {profile.matchScore}%
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  Based on skill overlap and complementary strengths between your profile and this student.
                </p>
              </div>
            )}

            {/* Empty state */}
            {allSkills.length === 0 && !profile.bio && (
              <div style={{ ...S.card, textAlign: 'center' as const, padding: '32px 20px' }}>
                <span style={{ fontSize: 32 }}>📋</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '8px 0 0' }}>
                  This student hasn't filled in their skills yet.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}

// ─── Background ───────────────────────────────────────────────────────────────

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:          { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  centered:      { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 8 },
  spinner:       { width: 34, height: 34, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' },
  nav:           { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:      { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 12 },
  navLogo:       { display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  logoIcon:      { width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText:      { fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent:    { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  backBtn:       { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
  content:       { maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },
  twoCol:        { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' },
  leftCol:       { display: 'flex', flexDirection: 'column' as const, gap: 14 },
  rightCol:      { display: 'flex', flexDirection: 'column' as const, gap: 14 },
  profileCard:   { background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '28px 22px', boxShadow: '0 2px 12px rgba(99,102,241,0.06)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 10, position: 'relative' as const },
  matchBadge:    { position: 'absolute' as const, top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20 },
  avatarWrap:    { width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 4px #eef2ff' },
  avatarFallback:{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white' },
  name:          { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, textAlign: 'center' as const, fontFamily: 'Syne, sans-serif' },
  pill:          { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },
  bio:           { fontSize: 13, color: '#64748b', lineHeight: 1.7, textAlign: 'center' as const, margin: 0 },
  infoRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' },
  infoLabel:     { fontSize: 11, color: '#94a3b8', fontWeight: 600 },
  infoVal:       { fontSize: 12, color: '#334155', fontWeight: 600, textAlign: 'right' as const, maxWidth: 160 },
  socialBtn:     { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', textDecoration: 'none' },
  card:          { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' },
  sectionTitle:  { fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase' as const, letterSpacing: '0.07em' },
  chipRow:       { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  roleChip:      { padding: '4px 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, color: '#6366f1', fontWeight: 600 },
  langChip:      { padding: '4px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, fontSize: 12, color: '#16a34a', fontWeight: 600 },
}
