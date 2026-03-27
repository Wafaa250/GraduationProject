import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Users, Zap, ChevronRight, Bell, LogOut, Filter, X, Settings, MessageCircle } from 'lucide-react'
import api from '../api/axiosInstance'

interface Student {
  userId: number
  profileId: number
  name: string
  university: string
  major: string
  academicYear: string
  skills: string[]
  matchScore: number
  profilePicture: string | null
}

interface Filters {
  universities: string[]
  majors: string[]
  skills: string[]
}

const DUMMY_STUDENTS: Student[] = [
  { userId: 1, profileId: 1, name: 'Ahmad Khaled',  university: 'An-Najah National University (NNU)', major: 'Computer Engineering',    academicYear: 'Third Year',  skills: ['React', 'AI', 'Python', 'Node.js'],          matchScore: 87, profilePicture: null },
  { userId: 2, profileId: 2, name: 'Sara Nasser',   university: 'Birzeit University',                 major: 'Software Engineering',    academicYear: 'Fourth Year', skills: ['Node.js', 'ML', 'TypeScript', 'Docker'],      matchScore: 79, profilePicture: null },
  { userId: 3, profileId: 3, name: 'Omar Hasan',    university: 'Palestine Polytechnic',              major: 'Data Science',            academicYear: 'Third Year',  skills: ['Python', 'Data Analysis', 'SQL', 'MATLAB'],   matchScore: 72, profilePicture: null },
  { userId: 4, profileId: 4, name: 'Lina Barakat',  university: 'An-Najah National University (NNU)', major: 'Cyber Security',          academicYear: 'Second Year', skills: ['Networking', 'Linux', 'Python', 'Wireshark'], matchScore: 65, profilePicture: null },
  { userId: 5, profileId: 5, name: 'Kareem Jaber',  university: 'Birzeit University',                 major: 'Artificial Intelligence', academicYear: 'Fourth Year', skills: ['TensorFlow', 'Python', 'NLP', 'CV'],          matchScore: 91, profilePicture: null },
  { userId: 6, profileId: 6, name: 'Nour Khalil',   university: 'An-Najah National University (NNU)', major: 'Information Technology',  academicYear: 'Third Year',  skills: ['React', 'Vue', 'CSS', 'Figma'],               matchScore: 58, profilePicture: null },
]

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents]     = useState<Student[]>([])
  const [filters, setFilters]       = useState<Filters>({ universities: [], majors: [], skills: [] })
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [selectedMajor, setSelectedMajor]           = useState('')
  const [selectedSkill, setSelectedSkill]           = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [invitingId, setInvitingId] = useState<number | null>(null)
  const [inviteMsg, setInviteMsg]   = useState<{ id: number; msg: string } | null>(null)

  useEffect(() => {
    api.get('/students/filters').then(res => setFilters(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedUniversity) params.append('university', selectedUniversity)
        if (selectedMajor)      params.append('major', selectedMajor)
        if (selectedSkill)      params.append('skill', selectedSkill)
        if (search)             params.append('search', search)
        const res = await api.get(`/students?${params.toString()}`)
        setStudents(res.data?.length > 0 ? res.data : DUMMY_STUDENTS)
      } catch { setStudents(DUMMY_STUDENTS) }
      finally  { setLoading(false) }
    }
    load()
  }, [selectedUniversity, selectedMajor, selectedSkill, search])

  const handleInvite = async (student: Student) => {
    setInvitingId(student.userId)
    try {
      await api.post('/invitations', { receiverId: student.userId })
    } catch {}
    setInviteMsg({ id: student.userId, msg: '✅ Invitation sent!' })
    setInvitingId(null)
    setTimeout(() => setInviteMsg(null), 3000)
  }

  const clearFilters = () => { setSelectedUniversity(''); setSelectedMajor(''); setSelectedSkill(''); setSearch('') }
  const hasActiveFilters = selectedUniversity || selectedMajor || selectedSkill

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center' as const }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
          <Users size={20} color="white" />
        </div>
        <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Loading students...</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <BgDecor />

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/" style={S.navLogo}>
            <div style={S.logoIconWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
          </Link>
          <div style={S.navLinks}>
            <Link to="/dashboard" style={S.navLink}>Dashboard</Link>
            <Link to="/profile"   style={S.navLink}>Profile</Link>
            <Link to="/students"  style={{ ...S.navLink, ...S.navLinkActive }}>Students</Link>
            <Link to="/projects"  style={S.navLink}>Projects</Link>
          </div>
          <div style={S.navActions}>
            <button style={S.navBtn}><Bell size={17} /></button>
            <button style={S.navBtn}><MessageCircle size={17} /></button>
            <Link to="/settings" style={S.navBtn}><Settings size={17} /></Link>
            <button style={S.navBtn} onClick={() => { localStorage.clear(); navigate('/login') }}><LogOut size={16} /></button>
          </div>
        </div>
      </nav>

      <div style={S.content}>

        {/* HERO */}
        <div style={S.hero}>
          <div>
            <h1 style={S.pageTitle}>Find Teammates 👥</h1>
            <p style={S.pageSubtitle}>
              <span style={{ color: '#6366f1', fontWeight: 700 }}>{students.length} students</span> matched based on your skills
            </p>
          </div>
          <div style={S.heroStats}>
            {[
              { label: 'Total Students', value: String(students.length) },
              { label: 'High Match',     value: String(students.filter(s => s.matchScore >= 70).length) },
              { label: 'Best Match',     value: `${students[0]?.matchScore ?? 0}%` },
            ].map(stat => (
              <div key={stat.label} style={S.statCard}>
                <p style={S.statValue}>{stat.value}</p>
                <p style={S.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div style={S.filterBar}>
          <div style={S.searchWrap}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input style={S.searchInput} placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowFilters(f => !f)} style={{ ...S.filterToggleBtn, ...(showFilters ? S.filterToggleBtnActive : {}) }}>
            <Filter size={14} /> Filters {hasActiveFilters && <span style={S.filterDot} />}
          </button>
          {hasActiveFilters && <button onClick={clearFilters} style={S.clearBtn}><X size={13} /> Clear</button>}
        </div>

        {/* FILTER PANEL */}
        {showFilters && (
          <div style={S.filterPanel}>
            {[
              { label: 'University', value: selectedUniversity, setter: setSelectedUniversity, options: filters.universities, placeholder: 'All Universities' },
              { label: 'Major',      value: selectedMajor,      setter: setSelectedMajor,      options: filters.majors,        placeholder: 'All Majors' },
              { label: 'Skill',      value: selectedSkill,      setter: setSelectedSkill,      options: filters.skills,        placeholder: 'All Skills' },
            ].map(f => (
              <div key={f.label} style={S.filterGroup}>
                <label style={S.filterLabel}>{f.label}</label>
                <select style={S.filterSelect} value={f.value} onChange={e => f.setter(e.target.value)}>
                  <option value="">{f.placeholder}</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVE CHIPS */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16 }}>
            {selectedUniversity && <span style={S.activeChip}>🏫 {selectedUniversity}<button onClick={() => setSelectedUniversity('')} style={S.chipX}>×</button></span>}
            {selectedMajor      && <span style={S.activeChip}>📚 {selectedMajor}<button onClick={() => setSelectedMajor('')} style={S.chipX}>×</button></span>}
            {selectedSkill      && <span style={S.activeChip}>⚡ {selectedSkill}<button onClick={() => setSelectedSkill('')} style={S.chipX}>×</button></span>}
          </div>
        )}

        {/* GRID */}
        {students.length === 0 ? (
          <div style={S.emptyState}>
            <span style={{ fontSize: 48 }}>👥</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#475569', margin: '12px 0 6px' }}>No students found</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Try changing the filters</p>
            <button onClick={clearFilters} style={S.clearFiltersBtn}>Clear Filters</button>
          </div>
        ) : (
          <div style={S.grid}>
            {students.map(student => (
              <div key={student.userId} style={S.card}>
                {/* Avatar + Match */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={S.avatar}>
                      {student.profilePicture
                        ? <img src={student.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: '50%' }} alt="" />
                        : <div style={S.avatarFallback}>{student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{student.name}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{student.academicYear}</p>
                    </div>
                  </div>
                  <div style={{ ...S.matchBadge, background: student.matchScore >= 80 ? '#f0fdf4' : student.matchScore >= 60 ? '#eef2ff' : '#f8fafc', border: `1px solid ${student.matchScore >= 80 ? '#bbf7d0' : student.matchScore >= 60 ? '#c7d2fe' : '#e2e8f0'}` }}>
                    <Zap size={10} style={{ color: student.matchScore >= 80 ? '#16a34a' : student.matchScore >= 60 ? '#6366f1' : '#94a3b8' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: student.matchScore >= 80 ? '#16a34a' : student.matchScore >= 60 ? '#6366f1' : '#94a3b8' }}>{student.matchScore}%</span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 3px', fontWeight: 500 }}>🏫 {student.university}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 500 }}>📚 {student.major}</p>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 16 }}>
                  {student.skills.slice(0, 4).map(s => <span key={s} style={S.skillChip}>{s}</span>)}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigate(`/profile/${student.userId}`)} style={S.viewBtn}>
                    View <ChevronRight size={12} />
                  </button>
                  {inviteMsg?.id === student.userId ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{inviteMsg.msg}</div>
                  ) : (
                    <button disabled={invitingId === student.userId} onClick={() => handleInvite(student)} style={{ ...S.inviteBtn, opacity: invitingId === student.userId ? 0.7 : 1 }}>
                      {invitingId === student.userId ? '⏳' : '✉️ Invite'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        input::placeholder { color: #94a3b8; }
        input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        select:focus { outline: none; border-color: #6366f1 !important; }
        button:hover:not(:disabled) { opacity: 0.9; }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  nav:     { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 16 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8, flexShrink: 0 },
  logoIconWrap: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  logoText:   { fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent: { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navLinks:   { display: 'flex', gap: 4, flex: 1, justifyContent: 'center' },
  navLink:    { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#64748b', textDecoration: 'none' },
  navLinkActive: { color: '#6366f1', background: '#eef2ff', fontWeight: 700 },
  navActions: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  navBtn:     { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: 8, textDecoration: 'none' },

  content:  { maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },
  hero:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '24px 28px', background: 'white', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, boxShadow: '0 4px 24px rgba(99,102,241,0.06)' },
  pageTitle:    { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px', fontFamily: 'Syne, sans-serif' },
  pageSubtitle: { fontSize: 13, color: '#64748b', margin: 0 },
  heroStats:  { display: 'flex', gap: 12 },
  statCard:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 },
  statValue:  { fontSize: 22, fontWeight: 800, color: '#6366f1', margin: '0 0 2px', fontFamily: 'Syne, sans-serif' },
  statLabel:  { fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },

  filterBar:  { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' },
  searchWrap: { flex: 1, position: 'relative' },
  searchInput:{ width: '100%', padding: '10px 14px 10px 36px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#0f172a', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  filterToggleBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' },
  filterToggleBtnActive: { background: '#eef2ff', border: '1.5px solid #c7d2fe', color: '#6366f1' },
  filterDot:  { width: 7, height: 7, borderRadius: '50%', background: '#6366f1', position: 'absolute', top: 6, right: 6 },
  clearBtn:   { display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 10, color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  filterPanel: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: 16, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(99,102,241,0.04)' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  filterLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  filterSelect:{ padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' },

  activeChip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, color: '#6366f1', fontWeight: 600 },
  chipX:      { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 15, padding: 0, lineHeight: 1, fontFamily: 'inherit' },

  grid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card:   { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(99,102,241,0.04)' },
  avatar: { width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' },
  avatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', borderRadius: '50%' },
  matchBadge: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 10 },
  skillChip:  { padding: '3px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },
  viewBtn:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  inviteBtn:  { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },

  emptyState:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', textAlign: 'center' },
  clearFiltersBtn:{ marginTop: 16, padding: '10px 24px', background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 10, color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}