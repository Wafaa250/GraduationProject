import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Circle, Pencil,
  MapPin, GraduationCap, BookOpen, Star, Zap
} from 'lucide-react'
import api from '../../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentProfile {
  name: string
  email: string
  role: string
  university?: string
  faculty?: string
  major?: string
  academicYear?: string
  gpa?: string
  generalSkills?: string[]
  majorSkills?: string[]
  profilePic?: string | null
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/login'); return }

        const res = await api.get('/me')
        const data = res.data
        setUser({
          name: data.name || data.fullName,
          email: data.email,
          role: data.role || localStorage.getItem('role') || 'student',
          university: data.university,
          faculty: data.faculty,
          major: data.major,
          academicYear: data.academicYear,
          gpa: data.gpa,
          generalSkills: data.generalSkills || [],
          majorSkills: data.majorSkills || [],
          profilePic: data.profilePictureBase64 || null,
        })
      } catch {
        setUser({
          name: localStorage.getItem('name') || 'Student',
          email: localStorage.getItem('email') || '',
          role: localStorage.getItem('role') || 'student',
          generalSkills: [],
          majorSkills: [],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [navigate])

  const generalSkills = user?.generalSkills || []
  const majorSkills   = user?.majorSkills   || []
  const allSkills     = [...generalSkills, ...majorSkills]

  const completeness = Math.min(
    20 +
    (user?.university ? 15 : 0) +
    (user?.major      ? 15 : 0) +
    (allSkills.length  > 0 ? 20 : 0) +
    (user?.gpa        ? 10 : 0) +
    (user?.profilePic ? 20 : 0),
    100
  )

  const PROFILE_TASKS = [
    { id: '1', label: 'Add a profile picture',       done: !!user?.profilePic,                       link: '/edit-profile#basic'  },
    { id: '2', label: 'Add general skills',           done: generalSkills.length > 0,                 link: '/edit-profile#skills' },
    { id: '3', label: 'Add major skills',             done: majorSkills.length  > 0,                  link: '/edit-profile#skills' },
    { id: '4', label: 'Complete academic info',       done: !!user?.major && !!user?.university,       link: '/edit-profile#basic'  },
    { id: '5', label: 'Add preferred project topics', done: false,                                    link: '/edit-profile#work'   },
  ]

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff,#f0f4ff,#faf5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' as const }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Loading profile...</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {/* Bg blobs */}
      <div style={S.blob1} />
      <div style={S.blob2} />

      {/* ── Top bar ── */}
      <div style={S.topBar}>
        <div style={S.topBarInner}>
          <button onClick={() => navigate('/dashboard')} style={S.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div style={S.content}>

        {/* ══════════════════════════════════════
            1 — HERO: Avatar · Name · Major · University
        ══════════════════════════════════════ */}
        <div style={S.heroCard}>
          {/* Avatar */}
          <div style={S.avatarWrap}>
            {user?.profilePic
              ? <img src={user.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} alt="" />
              : (
                <div style={S.avatarFallback}>
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
                </div>
              )
            }
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <h1 style={S.heroName}>{user?.name || 'Student'}</h1>
            <div style={S.heroBadges}>
              {user?.major && (
                <span style={S.badge}>
                  <GraduationCap size={12} /> {user.major}
                </span>
              )}
              {user?.university && (
                <span style={{ ...S.badge, background: '#faf5ff', border: '1px solid #e9d5ff', color: '#7c3aed' }}>
                  <MapPin size={12} /> {user.university}
                </span>
              )}
              {user?.academicYear && (
                <span style={{ ...S.badge, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
                  <Star size={12} /> {user.academicYear}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={S.mainGrid}>
          {/* ── LEFT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

            {/* ══════════════════════════════════════
                2 — ACADEMIC INFO
            ══════════════════════════════════════ */}
            <div style={S.card}>
              <div style={S.sectionHeader}>
                <BookOpen size={15} color="#6366f1" />
                <h2 style={S.sectionTitle}>Academic Info</h2>
              </div>
              <div style={S.infoGrid}>
                {[
                  { label: 'Email',      value: user?.email,        icon: '📧' },
                  { label: 'Faculty',    value: user?.faculty,      icon: '🏛️' },
                  { label: 'Year',       value: user?.academicYear, icon: '📅' },
                  { label: 'GPA',        value: user?.gpa,          icon: '🎯' },
                ].map(item => (
                  <div key={item.label} style={S.infoCell}>
                    <p style={S.infoCellLabel}>{item.icon} {item.label}</p>
                    <p style={{ ...S.infoCellValue, color: item.value ? '#0f172a' : '#cbd5e1' }}>
                      {item.value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════
                3 — SKILLS
            ══════════════════════════════════════ */}
            <div style={S.card}>
              <div style={S.sectionHeader}>
                <Zap size={15} color="#a855f7" />
                <h2 style={S.sectionTitle}>Skills</h2>
                <Link to="/edit-profile#skills" style={S.inlineEditLink}>+ Add skills</Link>
              </div>

              {allSkills.length === 0 ? (
                <div style={S.emptySkills}>
                  <span style={{ fontSize: 28 }}>🧩</span>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>No skills added yet</p>
                  <Link to="/edit-profile#skills" style={S.addSkillsBtn}>Add your skills →</Link>
                </div>
              ) : (
                <>
                  {generalSkills.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={S.skillGroupLabel}>General Skills</p>
                      <div style={S.skillsRow}>
                        {generalSkills.map(s => (
                          <span key={s} style={S.skillChip}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {majorSkills.length > 0 && (
                    <div>
                      <p style={S.skillGroupLabel}>Major Skills</p>
                      <div style={S.skillsRow}>
                        {majorSkills.map(s => (
                          <span key={s} style={{ ...S.skillChip, background: '#faf5ff', border: '1px solid #e9d5ff', color: '#7c3aed' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

          {/* ── RIGHT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

            {/* ══════════════════════════════════════
                4 — PROFILE COMPLETENESS
            ══════════════════════════════════════ */}
            <div style={S.card}>
              <div style={S.sectionHeader}>
                <CheckCircle2 size={15} color="#6366f1" />
                <h2 style={S.sectionTitle}>Profile Completeness</h2>
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={S.progressTrack}>
                  <div style={{ ...S.progressFill, width: `${completeness}%` }} />
                </div>
                <span style={S.progressPct}>{completeness}%</span>
              </div>
              <p style={S.progressHint}>
                {completeness >= 80 ? '🔥 Strong profile — you\'re ready to match!' : 'Complete your profile to unlock better AI matches'}
              </p>

              {/* Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginTop: 16 }}>
                {PROFILE_TASKS.map(task => (
                  <div key={task.id} style={S.taskRow}>
                    {task.done
                      ? <CheckCircle2 size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                      : <Circle      size={16} color="#cbd5e1"  style={{ flexShrink: 0 }} />
                    }
                    <span style={{
                      flex: 1, fontSize: 13, color: '#475569', fontWeight: 500,
                      textDecoration: task.done ? 'line-through' : 'none',
                      opacity: task.done ? 0.45 : 1,
                    }}>
                      {task.label}
                    </span>
                    {!task.done && (
                      <Link to={task.link} style={S.doItLink}>Do it →</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════
                5 — EDIT PROFILE CTA
            ══════════════════════════════════════ */}
            <Link to="/edit-profile" style={S.editCta}>
              <Pencil size={16} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Edit Profile</span>
            </Link>

          </div>
        </div>
      </div>

      <style>{`a { text-decoration: none; } button:hover { opacity: 0.88; }`}</style>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:           { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 45%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative', overflow: 'hidden' },
  blob1:          { position: 'fixed', top: -160, right: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  blob2:          { position: 'fixed', bottom: -120, left: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 },

  // top bar
  topBar:         { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  topBarInner:    { maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:        { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b', fontFamily: 'inherit', padding: 0 },
  editBtn:        { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' },

  content:        { maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px', position: 'relative', zIndex: 1 },

  // hero
  heroCard:       { display: 'flex', alignItems: 'center', gap: 24, padding: '28px 32px', background: 'white', borderRadius: 20, border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 4px 24px rgba(99,102,241,0.07)', marginBottom: 24 },
  avatarWrap:     { width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 4px #eef2ff, 0 4px 16px rgba(99,102,241,0.2)' },
  avatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' },
  heroName:       { margin: '0 0 12px', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', fontFamily: 'Syne, sans-serif' },
  heroBadges:     { display: 'flex', flexWrap: 'wrap', gap: 8 },
  badge:          { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#6366f1' },

  // layout
  mainGrid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' },

  // card
  card:           { background: 'white', borderRadius: 16, padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(99,102,241,0.04)' },
  sectionHeader:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle:   { margin: 0, fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em' },
  inlineEditLink: { marginLeft: 'auto', fontSize: 11, color: '#6366f1', fontWeight: 700, textDecoration: 'none' },

  // academic info grid
  infoGrid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  infoCell:       { padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' },
  infoCellLabel:  { margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 },
  infoCellValue:  { margin: 0, fontSize: 13, fontWeight: 700 },

  // skills
  emptySkills:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0', textAlign: 'center' },
  addSkillsBtn:   { padding: '6px 16px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#6366f1', textDecoration: 'none' },
  skillGroupLabel:{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' },
  skillsRow:      { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skillChip:      { padding: '5px 13px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#6366f1' },

  // completeness
  progressTrack:  { flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 4, transition: 'width 0.6s ease' },
  progressPct:    { fontSize: 16, fontWeight: 800, color: '#6366f1', minWidth: 40 },
  progressHint:   { margin: 0, fontSize: 12, color: '#94a3b8' },
  taskRow:        { display: 'flex', alignItems: 'center', gap: 10 },
  doItLink:       { fontSize: 11, fontWeight: 700, color: '#6366f1', textDecoration: 'none', whiteSpace: 'nowrap' },

  // edit cta
  editCta:        { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'opacity 0.2s' },
}