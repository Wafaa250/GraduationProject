import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, Search, Settings, ChevronRight, Users,
  BookOpen, CheckCircle2, Circle, Briefcase, MessageCircle,
  Activity, LogOut, UserPlus, Trophy, Sparkles, X
} from 'lucide-react'
import api from '../../../api/axiosInstance'
import JoinChannelModal from '../../components/student/JoinChannelModal'
import { getDashboardSummary, SuggestedTeammate } from '../../../api/dashboardApi'
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

// ─── Placeholder data ─────────────────────────────────────────────────────────
const DUMMY_TEAMMATES: SuggestedTeammate[] = [
  { userId: 1, profileId: 1, name: 'Ahmad Khaled', major: 'Computer Engineering', university: 'An-Najah University', academicYear: 'Third Year', profilePicture: null, skills: ['React', 'AI', 'Python'], matchScore: 87 },
  { userId: 2, profileId: 2, name: 'Sara Nasser', major: 'Software Engineering', university: 'Birzeit University', academicYear: 'Fourth Year', profilePicture: null, skills: ['Node.js', 'ML', 'TypeScript'], matchScore: 79 },
  { userId: 3, profileId: 3, name: 'Omar Hasan', major: 'Data Science', university: 'Palestine Polytechnic', academicYear: 'Third Year', profilePicture: null, skills: ['Python', 'Data Analysis', 'SQL'], matchScore: 72 },
]

const DUMMY_PROJECTS = [
  { id: 1, title: 'AI Medical Diagnosis System', lookingFor: ['Frontend Developer', 'AI Specialist'], matchScore: 82 },
  { id: 2, title: 'Blockchain Voting System', lookingFor: ['Backend Developer', 'Security Expert'], matchScore: 76 },
  { id: 3, title: 'Smart Agriculture IoT', lookingFor: ['Mobile Developer', 'Data Analyst'], matchScore: 68 },
]

const DUMMY_APPLICATIONS = [
  { id: 1, project: 'AI Health System', status: 'Pending' },
  { id: 2, project: 'Smart Parking App', status: 'Accepted' },
]

const DUMMY_INVITATIONS = [
  { id: 1, project: 'Smart Agriculture Project', invitedBy: 'Ahmad' },
]

const BROWSE_PROJECTS = [
  { id: 1, title: 'AI Medical Diagnosis System', desc: 'Build an AI-powered tool to assist doctors in diagnosing diseases from medical images.', tags: ['AI', 'Python', 'Healthcare'], lookingFor: ['Frontend Developer', 'AI Specialist'], match: 82, supervisor: 'Dr. Ali Hassan', open: true },
  { id: 2, title: 'Blockchain Voting System', desc: 'A secure, transparent voting platform built on blockchain technology for student elections.', tags: ['Blockchain', 'Node.js', 'Security'], lookingFor: ['Backend Developer', 'Security Expert'], match: 76, supervisor: 'Dr. Sara Nour', open: true },
  { id: 3, title: 'Smart Agriculture IoT', desc: 'IoT sensors + mobile app to help farmers monitor crops and soil conditions in real time.', tags: ['IoT', 'Mobile', 'Data'], lookingFor: ['Mobile Developer', 'Data Analyst'], match: 68, supervisor: 'Dr. Khaled Omar', open: false },
  { id: 4, title: 'E-Learning Accessibility Platform', desc: 'Improving accessibility features for online education tools for students with disabilities.', tags: ['React', 'UX', 'Accessibility'], lookingFor: ['UX Designer', 'Frontend Developer'], match: 61, supervisor: 'Dr. Mona Saad', open: true },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'projects' | 'teammates'>('all')
  const [user, setUser] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [teammates, setTeammates] = useState<SuggestedTeammate[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [invitations, setInvitations] = useState(DUMMY_INVITATIONS)
  const [inviteLoading, setInviteLoading] = useState<number | null>(null)
  const [inviteMsg, setInviteMsg] = useState<{ id: number; msg: string; ok: boolean } | null>(null)

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [editInfoOpen, setEditInfoOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    email: '', university: '', faculty: '', major: '', academicYear: '', gpa: ''
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  // ── NEW: Browse Projects modal ──
  const [projectsModalOpen, setProjectsModalOpen] = useState(false)

  // ── Join Channel modal ──
  const [joinChannelOpen, setJoinChannelOpen] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/login'); return }

        const profileRes = await api.get('/me')
        const data = profileRes.data
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

        try {
          const dashData = await getDashboardSummary()
          setTeammates(dashData.suggestedTeammates?.length > 0 ? dashData.suggestedTeammates : DUMMY_TEAMMATES)
        } catch {
          setTeammates(DUMMY_TEAMMATES)
        }
      } catch {
        setUser({
          name: localStorage.getItem('name') || 'Student',
          email: localStorage.getItem('email') || '',
          role: localStorage.getItem('role') || 'student',
          generalSkills: [], majorSkills: [],
        })
        setTeammates(DUMMY_TEAMMATES)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [navigate])

  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  const handleInvite = async (id: number, action: 'accept' | 'decline') => {
    setInviteLoading(id)
    setInviteMsg(null)
    try {
      await api.post(`/invitations/${id}/${action}`)
      setInvitations(prev => prev.filter(i => i.id !== id))
      setInviteMsg({ id, msg: action === 'accept' ? '✅ Invitation accepted!' : '❌ Invitation declined.', ok: action === 'accept' })
    } catch {
      setInvitations(prev => prev.filter(i => i.id !== id))
      setInviteMsg({ id, msg: action === 'accept' ? '✅ Accepted!' : 'Declined.', ok: action === 'accept' })
    } finally {
      setInviteLoading(null)
      setTimeout(() => setInviteMsg(null), 3000)
    }
  }

  const openEditInfo = () => {
    setEditForm({
      email: user?.email || '',
      university: user?.university || '',
      faculty: user?.faculty || '',
      major: user?.major || '',
      academicYear: user?.academicYear || '',
      gpa: user?.gpa || '',
    })
    setEditSuccess(false)
    setEditInfoOpen(true)
  }

  const handleSaveInfo = async () => {
    setEditSaving(true)
    try {
      await api.put('/me/profile', editForm)
    } catch {
      // API not ready yet — update UI optimistically
    }
    setUser(prev => prev ? { ...prev, ...editForm } : prev)
    setEditSaving(false)
    setEditSuccess(true)
    setTimeout(() => {
      setEditInfoOpen(false)
      setEditSuccess(false)
    }, 1000)
  }

  const allSkills = [...(user?.generalSkills || []), ...(user?.majorSkills || [])]
  const completeness = Math.min(
    20 + (user?.university ? 15 : 0) + (user?.major ? 15 : 0) +
    (allSkills.length > 0 ? 20 : 0) + (user?.gpa ? 10 : 0) + (user?.profilePic ? 20 : 0), 100
  )

  const PROFILE_TASKS = [
    { id: '1', label: 'Add a profile picture',        done: !!user?.profilePic,                       link: '/edit-profile#basic' },
    { id: '2', label: 'Add general skills',            done: (user?.generalSkills?.length || 0) > 0,   link: '/edit-profile#skills' },
    { id: '3', label: 'Add major skills',              done: (user?.majorSkills?.length || 0) > 0,     link: '/edit-profile#skills' },
    { id: '4', label: 'Complete academic info',        done: !!user?.major && !!user?.university,      link: '/edit-profile#basic' },
    { id: '5', label: 'Add preferred project topics',  done: false,                                    link: '/edit-profile#work' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' as const }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Loading your dashboard...</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/" style={S.navLogo}>
            <div style={S.logoIconWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
          </Link>
          <div style={S.searchWrap}>
            <Search size={14} style={S.searchIcon} />
            <input style={S.searchInput} placeholder="Search students, projects, skills, supervisors..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div style={S.navActions}>
            <div style={{ position: 'relative' as const }}>
              <button style={S.navBtn} onClick={() => setNotifOpen(o => !o)}>
                <Bell size={17} /><span style={S.notifDot} />
              </button>
              {notifOpen && (
                <div style={S.notifDropdown}>
                  <p style={S.notifTitle}>🔔 Notifications</p>
                  <div style={S.notifItem}>Ahmad invited you to join a project</div>
                  <div style={S.notifItem}>New project matches your skills</div>
                  <div style={S.notifItem}>Your profile was viewed 3 times</div>
                </div>
              )}
            </div>
            <button style={S.navBtn}><MessageCircle size={17} /></button>
            <Link to="/settings" style={S.navBtn}><Settings size={17} /></Link>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginRight: 4 }}
              onClick={() => setJoinChannelOpen(true)}
            >
              🔗 Join Channel
            </button>
            <button style={S.navBtn} onClick={handleLogout}><LogOut size={16} /></button>
            <Link to="/profile" style={S.navAvatar}>
              {user?.profilePic
                ? <img src={user.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} alt="" />
                : <div style={S.navAvatarFallback}>{user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}</div>
              }
            </Link>
          </div>
        </div>
      </nav>

      <div style={S.content}>

        {/* ── HERO ── */}
        <div style={S.hero}>
          <div style={S.heroLeft}>
            <p style={S.greetingText}>{greeting} 👋</p>
            <h1 style={S.heroName}>Welcome back, <span style={S.heroNameAccent}>{user?.name?.split(' ')[0] || 'Student'}</span></h1>
            <p style={S.heroSub}>{[user?.major, user?.academicYear, user?.university].filter(Boolean).join(' · ') || 'Complete your profile to get started'}</p>
            <div style={S.heroSkills}>
              {allSkills.length > 0
                ? allSkills.slice(0, 5).map(s => <span key={s} style={S.skillChip}>{s}</span>)
                : <Link to="/profile" style={{ ...S.skillChip, textDecoration: 'none', opacity: 0.7 }}>+ Add your skills</Link>
              }
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' as const }}>
              <Link to="/edit-profile" style={S.heroBtn}>✏️ Edit Profile</Link>

              {/* ── View Full Profile → navigates to /profile ── */}
              <Link
                to="/profile"
                style={{ ...S.heroBtn, background: 'white', color: '#6366f1', border: '1.5px solid #c7d2fe' }}
              >
                👤 View Full Profile
              </Link>

              {/* ── Browse Projects → opens modal ── */}
              <button
                onClick={() => setProjectsModalOpen(true)}
                style={{ ...S.heroBtn, background: 'white', color: '#6366f1', border: '1.5px solid #c7d2fe', cursor: 'pointer' }}
              >
                📁 Browse Projects
              </button>
            </div>
          </div>

          <div style={S.heroStats}>
            {[
              { icon: <Users size={18} />, label: 'Suggested Teammates', value: teammates.length > 0 ? `${teammates.length}` : '—' },
              { icon: <Briefcase size={18} />, label: 'Matched Projects',  value: `${DUMMY_PROJECTS.length}` },
              { icon: <Trophy size={18} />,  label: 'Best Match',          value: teammates.length > 0 ? `${teammates[0].matchScore}%` : '—' },
              { icon: <UserPlus size={18} />, label: 'Team Invitations',   value: `${DUMMY_INVITATIONS.length}` },
            ].map(stat => (
              <div key={stat.label} style={S.statCard}>
                <div style={S.statIcon}>{stat.icon}</div>
                <div>
                  <p style={S.statValue}>{stat.value}</p>
                  <p style={S.statLabel}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── GRID ── */}
        <div style={S.grid}>

          {/* LEFT COL */}
          <div style={S.leftCol}>

            {/* Profile Strength */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}><CheckCircle2 size={15} color="#6366f1" /> Profile Strength</h3>
              </div>
              <div style={S.progressRow}>
                <div style={S.progressTrack}><div style={{ ...S.progressFill, width: `${completeness}%` }} /></div>
                <span style={S.progressPct}>{completeness}%</span>
              </div>
              <p style={S.progressLabel}>{completeness >= 80 ? '🔥 Strong profile!' : 'Complete your profile to get better AI matches'}</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {PROFILE_TASKS.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {task.done ? <CheckCircle2 size={15} color="#6366f1" style={{ flexShrink: 0 }} /> : <Circle size={15} color="#cbd5e1" style={{ flexShrink: 0 }} />}
                    <span style={{ flex: 1, fontSize: 13, color: '#475569', fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.4 : 1 }}>{task.label}</span>
                    {!task.done && <Link to={task.link} style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Do it</Link>}
                  </div>
                ))}
              </div>
            </div>

            {/* My Info */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}><BookOpen size={15} color="#6366f1" /> My Info</h3>
                <button onClick={openEditInfo} style={S.cardActionBtn}>
                  Edit <ChevronRight size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {[
                  { label: 'Email',      value: user?.email },
                  { label: 'University', value: user?.university },
                  { label: 'Faculty',    value: user?.faculty },
                  { label: 'Major',      value: user?.major },
                  { label: 'Year',       value: user?.academicYear },
                  { label: 'GPA',        value: user?.gpa },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: item.value ? '#334155' : '#cbd5e1', fontWeight: 600, textAlign: 'right' as const, maxWidth: 170 }}>{item.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Applications */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}><Briefcase size={15} color="#6366f1" /> My Applications</h3>
                <Link to="/projects" style={S.cardAction}>See all <ChevronRight size={12} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {DUMMY_APPLICATIONS.map(app => (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{app.project}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: app.status === 'Accepted' ? '#dcfce7' : '#fef9c3', color: app.status === 'Accepted' ? '#16a34a' : '#a16207' }}>{app.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Invitations */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}><UserPlus size={15} color="#a855f7" /> Team Invitations</h3>
              </div>
              {invitations.length === 0 ? (
                <div style={S.emptyState}>
                  <span style={{ fontSize: 24 }}>🎉</span>
                  <p style={S.emptyDesc}>No pending invitations</p>
                </div>
              ) : (
                invitations.map(inv => (
                  <div key={inv.id} style={{ padding: '14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: '0 0 2px' }}>You were invited to join:</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', margin: '0 0 4px' }}>{inv.project}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>by {inv.invitedBy}</p>
                    {inviteMsg?.id === inv.id ? (
                      <p style={{ fontSize: 13, fontWeight: 700, color: inviteMsg.ok ? '#16a34a' : '#64748b', margin: 0 }}>{inviteMsg.msg}</p>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          disabled={inviteLoading === inv.id}
                          onClick={() => handleInvite(inv.id, 'accept')}
                          style={{ flex: 1, padding: '7px', background: inviteLoading === inv.id ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#a855f7)', color: inviteLoading === inv.id ? '#94a3b8' : 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: inviteLoading === inv.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                          {inviteLoading === inv.id ? '⏳' : '✅ Accept'}
                        </button>
                        <button
                          disabled={inviteLoading === inv.id}
                          onClick={() => handleInvite(inv.id, 'decline')}
                          style={{ flex: 1, padding: '7px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: inviteLoading === inv.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                          ✕ Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Recent Activity */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}><Activity size={15} color="#6366f1" /> Recent Activity</h3>
              </div>
              <div style={S.emptyState}>
                <span style={{ fontSize: 28 }}>📭</span>
                <p style={S.emptyTitle}>No activity yet</p>
                <p style={S.emptyDesc}>Your recent actions will appear here (joined projects, invitations, updates)</p>
              </div>
            </div>

          </div>

          {/* RIGHT COL */}
          <div style={S.rightCol}>

            {/* AI Banner */}
            <div style={S.aiBanner}>
              <Sparkles size={18} color="#a855f7" />
              <p style={{ margin: 0, fontSize: 13, color: '#4c1d95', fontWeight: 600 }}>
                <strong>AI Recommendations</strong> — Matching teammates based on your skills in{' '}
                <span style={{ color: '#7c3aed' }}>{allSkills.slice(0, 2).join(', ') || 'your major'}</span>
              </p>
            </div>

            <div style={S.filterRow}>
              {(['all', 'teammates', 'projects'] as const).map(f => (
                <button key={f} style={{ ...S.filterBtn, ...(activeFilter === f ? S.filterBtnActive : {}) }} onClick={() => setActiveFilter(f)}>
                  {f === 'all' ? '⚡ All Matches' : f === 'teammates' ? '👥 Teammates' : '📁 Projects'}
                </button>
              ))}
            </div>

            {/* Suggested Teammates */}
            {(activeFilter === 'all' || activeFilter === 'teammates') && (
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}><Users size={15} color="#6366f1" /> Suggested Teammates</h3>
                  <Link to="/students" style={S.cardAction}>See all <ChevronRight size={12} /></Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {teammates.slice(0, 3).map(t => (
                    <div key={t.userId} style={S.teammateCard}>
                      <div style={S.teammateAvatar}>
                        {t.profilePicture
                          ? <img src={t.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: '50%' }} alt="" />
                          : <div style={S.teammateAvatarFallback}>{t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{t.name}</p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{t.major}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                          {t.skills.slice(0, 3).map(s => <span key={s} style={S.skillChipSm}>{s}</span>)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        <div style={S.matchBadge}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{t.matchScore}%</span>
                          <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Match</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => navigate(`/profile/${t.userId}`)} style={S.btnSm}>View</button>
                          <button
                            onClick={() => alert(`Invitation sent to ${t.name}!`)}
                            style={{ ...S.btnSm, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none' }}>
                            Invite
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Projects */}
            {(activeFilter === 'all' || activeFilter === 'projects') && (
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}><Briefcase size={15} color="#a855f7" /> Recommended Projects</h3>
                  <Link to="/projects" style={S.cardAction}>See all <ChevronRight size={12} /></Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {DUMMY_PROJECTS.map(p => (
                    <div key={p.id} style={S.projectCard}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{p.title}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px', fontWeight: 500 }}>Looking for:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                          {p.lookingFor.map(r => <span key={r} style={{ ...S.skillChipSm, background: '#faf5ff', color: '#a855f7', borderColor: '#e9d5ff' }}>{r}</span>)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        <div style={{ ...S.matchBadge, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#a855f7' }}>{p.matchScore}%</span>
                          <span style={{ fontSize: 10, color: '#a855f7', fontWeight: 600 }}>Match</span>
                        </div>
                        <button onClick={() => navigate(`/projects/${p.id}`)} style={{ ...S.btnSm, background: 'linear-gradient(135deg,#a855f7,#6366f1)', color: 'white', border: 'none' }}>View Project</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          EDIT MY INFO MODAL
      ══════════════════════════════════════════ */}
      {editInfoOpen && (
        <div style={S.modalOverlay} onClick={() => setEditInfoOpen(false)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>
                ✏️ Edit My Info
              </h3>
              <button onClick={() => setEditInfoOpen(false)} style={S.modalCloseBtn}>
                <X size={15} />
              </button>
            </div>
            {[
              { key: 'email',        label: 'Email',         type: 'email' },
              { key: 'university',   label: 'University',    type: 'text'  },
              { key: 'faculty',      label: 'Faculty',       type: 'text'  },
              { key: 'major',        label: 'Major',         type: 'text'  },
              { key: 'academicYear', label: 'Academic Year', type: 'text'  },
              { key: 'gpa',          label: 'GPA',           type: 'text'  },
            ].map(({ key, label, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                  {label}
                </label>
                <input
                  type={type}
                  style={S.modalInput}
                  value={editForm[key as keyof typeof editForm]}
                  onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Enter your ${label.toLowerCase()}`}
                />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button onClick={() => setEditInfoOpen(false)} style={S.modalCancelBtn}>Cancel</button>
              <button onClick={handleSaveInfo} disabled={editSaving}
                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: editSuccess ? '#16a34a' : 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 13, fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minWidth: 120, transition: 'background 0.3s' }}>
                {editSaving ? '⏳ Saving...' : editSuccess ? '✅ Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          BROWSE PROJECTS MODAL
      ══════════════════════════════════════════ */}
      {projectsModalOpen && (
        <div style={S.modalOverlay} onClick={() => setProjectsModalOpen(false)}>
          <div style={{ ...S.modalBox, width: 600, maxHeight: '85vh', overflowY: 'auto' as const }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>
                📁 Browse Projects
              </h3>
              <button onClick={() => setProjectsModalOpen(false)} style={S.modalCloseBtn}>
                <X size={15} />
              </button>
            </div>

            {/* AI match banner */}
            <div style={{ ...S.aiBanner, marginBottom: 16 }}>
              <Sparkles size={15} color="#a855f7" />
              <p style={{ margin: 0, fontSize: 12, color: '#4c1d95', fontWeight: 600 }}>
                Showing projects matched to your skills — sorted by best fit
              </p>
            </div>

            {/* Project List */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {BROWSE_PROJECTS.map(project => (
                <div
                  key={project.id}
                  style={{ padding: '16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#c7d2fe')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      {/* Title + Open/Full badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{project.title}</p>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: project.open ? '#dcfce7' : '#fee2e2',
                          color: project.open ? '#16a34a' : '#dc2626'
                        }}>
                          {project.open ? 'Open' : 'Full'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{project.desc}</p>
                      <p style={{ margin: '0 0 8px', fontSize: 11, color: '#94a3b8' }}>👨‍🏫 {project.supervisor}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 8 }}>
                        {project.tags.map(t => <span key={t} style={S.skillChipSm}>{t}</span>)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginRight: 2 }}>Looking for:</span>
                        {project.lookingFor.map(r => (
                          <span key={r} style={{ ...S.skillChipSm, background: '#faf5ff', color: '#a855f7', borderColor: '#e9d5ff' }}>{r}</span>
                        ))}
                      </div>
                    </div>

                    {/* Match + Apply */}
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <div style={{
                        ...S.matchBadge,
                        background: project.match >= 80 ? '#f0fdf4' : '#faf5ff',
                        border: `1px solid ${project.match >= 80 ? '#bbf7d0' : '#e9d5ff'}`
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: project.match >= 80 ? '#16a34a' : '#a855f7' }}>{project.match}%</span>
                        <span style={{ fontSize: 9, color: project.match >= 80 ? '#16a34a' : '#a855f7', fontWeight: 600 }}>Match</span>
                      </div>
                      {project.open ? (
                        <button
                          onClick={() => alert(`Applied to "${project.title}"!`)}
                          style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
                          Apply Now
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Team full</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 20, textAlign: 'center' as const }}>
              <button
                onClick={() => { setProjectsModalOpen(false); navigate('/projects') }}
                style={{ padding: '10px 28px', background: 'white', border: '1.5px solid #c7d2fe', borderRadius: 10, color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                View All Projects →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Join Channel Modal ── */}
      {joinChannelOpen && (
        <JoinChannelModal
          onClose={() => setJoinChannelOpen(false)}
          onJoined={(name) => console.log('Joined channel:', name)}
        />
      )}

      <style>{`
        input::placeholder { color: #94a3b8; }
        input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        button:hover { opacity: 0.9; }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}

// ─── Background decoration ────────────────────────────────────────────────────
function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:               { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  nav:                { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:           { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 16 },
  navLogo:            { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8, flexShrink: 0 },
  logoIconWrap:       { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  logoText:           { fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent:         { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  searchWrap:         { flex: 1, maxWidth: 420, position: 'relative' },
  searchIcon:         { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' },
  searchInput:        { width: '100%', padding: '9px 14px 9px 36px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#0f172a', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  navActions:         { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  navBtn:             { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: 8, position: 'relative', textDecoration: 'none' },
  notifDot:           { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#6366f1', border: '1.5px solid #f8f7ff' },
  navAvatar:          { width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', marginLeft: 4, textDecoration: 'none', flexShrink: 0 },
  navAvatarFallback:  { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' },
  notifDropdown:      { position: 'absolute', top: 44, right: 0, width: 280, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'hidden' },
  notifTitle:         { fontSize: 13, fontWeight: 700, color: '#334155', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', margin: 0 },
  notifItem:          { fontSize: 13, color: '#475569', padding: '10px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer' },
  content:            { maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },
  hero:               { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24, padding: '24px 28px', background: 'white', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, boxShadow: '0 4px 24px rgba(99,102,241,0.06)' },
  heroLeft:           { flex: 1 },
  greetingText:       { fontSize: 13, color: '#94a3b8', margin: '0 0 4px', fontWeight: 500 },
  heroName:           { fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.5px', fontFamily: 'Syne, sans-serif' },
  heroNameAccent:     { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub:            { fontSize: 13, color: '#64748b', margin: '0 0 12px' },
  heroSkills:         { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skillChip:          { padding: '4px 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },
  heroBtn:            { padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 },
  heroStats:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 },
  statCard:           { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 },
  statIcon:           { width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6366f1' },
  statValue:          { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 2px', fontFamily: 'Syne, sans-serif' },
  statLabel:          { fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 500 },
  aiBanner:           { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'linear-gradient(135deg,rgba(168,85,247,0.08),rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, marginBottom: 4 },
  grid:               { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' },
  leftCol:            { display: 'flex', flexDirection: 'column', gap: 14 },
  rightCol:           { display: 'flex', flexDirection: 'column', gap: 14 },
  card:               { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px', boxShadow: '0 2px 12px rgba(99,102,241,0.04)' },
  cardHeader:         { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle:          { fontSize: 11, fontWeight: 700, color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.08em' },
  cardAction:         { display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
  cardActionBtn:      { display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
  progressRow:        { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  progressTrack:      { flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill:       { height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 3, transition: 'width 0.6s ease' },
  progressPct:        { fontSize: 15, fontWeight: 800, color: '#6366f1', minWidth: 36 },
  progressLabel:      { fontSize: 12, color: '#94a3b8', margin: '0 0 12px' },
  filterRow:          { display: 'flex', gap: 6, marginBottom: 4 },
  filterBtn:          { padding: '7px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 20, color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
  filterBtnActive:    { background: '#eef2ff', border: '1.5px solid #c7d2fe', color: '#6366f1' },
  teammateCard:       { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' },
  teammateAvatar:     { width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' },
  teammateAvatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', borderRadius: '50%' },
  projectCard:        { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' },
  matchBadge:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 },
  skillChipSm:        { padding: '3px 8px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 10, color: '#6366f1', fontWeight: 600 },
  btnSm:              { padding: '5px 12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  emptyState:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 8, textAlign: 'center' },
  emptyTitle:         { fontSize: 14, fontWeight: 700, color: '#475569', margin: 0 },
  emptyDesc:          { fontSize: 12, color: '#94a3b8', margin: 0, maxWidth: 260, lineHeight: 1.6 },
  // ── Modals ──
  modalOverlay:       { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)' },
  modalBox:           { background: 'white', borderRadius: 20, padding: '28px', width: 440, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(99,102,241,0.18)' },
  modalInput:         { width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#0f172a', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8fafc' },
  modalCloseBtn:      { width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
  modalCancelBtn:     { padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  modalSectionLabel:  { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' },
}