// src/app/pages/doctor/DoctorDashboardPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Users, Layers, Plus, Search, Bell, LogOut, Settings } from 'lucide-react'
import { useDoctor } from './DoctorContext'
import CourseChannelCard from '../../components/doctor/CourseChannelCard'
import GradProjectCard from '../../components/doctor/GradProjectCard'
import StudentListModal from '../../components/doctor/StudentListModal'
import CreateChannelModal from '../../components/doctor/CreateChannelModal'
import { CourseChannel } from './data/doctorMockData'

type Tab = 'overview' | 'courses' | 'graduation'

export default function DoctorDashboardPage() {
  const navigate = useNavigate()
  const { courses, gradProjects, addCourse, addGradProject } = useDoctor()
  const [tab, setTab]                         = useState<Tab>('overview')
  const [search, setSearch]                   = useState('')
  const [managingStudents, setManagingStudents] = useState<CourseChannel | null>(null)
  const [showCreate, setShowCreate]           = useState(false)

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.courseCode.toLowerCase().includes(search.toLowerCase())
  )
  const filteredGrad = gradProjects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    totalCourses:      courses.length,
    totalGradProjects: gradProjects.length,
    totalStudents:     courses.reduce((a, c) => a + c.studentsCount, 0),
    activeTeams:       courses.reduce((a, c) => a + c.teams.length, 0),
  }

  const handleCreate = async (data: { type: 'course' | 'graduation'; name: string; code: string; section: string }) => {
    if (data.type === 'course') await addCourse(data)
    else addGradProject(data)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={S.page}>
      <BgDecor />

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/" style={S.navLogo}>
            <div style={S.logoIconWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
          </Link>
          <div style={S.navLinks}>
            <span style={{ ...S.navLink, ...S.navLinkActive }}>Doctor Panel</span>
          </div>
          <div style={S.navActions}>
            <Link to="/profile" style={S.navBtn}><Settings size={17} /></Link>
            <button style={S.navBtn}><Bell size={17} /></button>
            <button style={{ ...S.navBtn, color: '#ef4444' }} onClick={handleLogout}><LogOut size={17} /></button>
          </div>
        </div>
      </nav>

      <div style={S.content}>

        {/* Hero */}
        <div style={S.hero}>
          <div>
            <h1 style={S.pageTitle}>Doctor Dashboard</h1>
            <p style={S.pageSubtitle}>Spring Semester 2025 · Welcome back, {localStorage.getItem('name') || 'Doctor'}</p>
          </div>
          <div style={S.heroStats}>
            {[
              { label: 'COURSES', value: stats.totalCourses, icon: <BookOpen size={14} color="#6366f1" />, color: '#6366f1' },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  {s.icon}
                  <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
                </div>
                <p style={S.statLabel}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div style={S.toolbar}>
          <div style={S.tabs}>
            {(['overview','courses','graduation'] as Tab[]).map(t => (
              <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>
                {t === 'overview' ? 'Overview' : t === 'courses' ? 'Course Channels' : 'Graduation Channels'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={S.searchWrap}>
              <Search size={14} style={S.searchIcon} />
              <input style={S.searchInput} placeholder="Search channels..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button style={S.createBtn} onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create Channel
            </button>
          </div>
        </div>

        {/* Course Channels */}
        {(tab === 'overview' || tab === 'courses') && (
          <section style={S.section}>
            <div style={S.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} color="#6366f1" />
                <h2 style={S.sectionTitle}>Course Channels</h2>
                <span style={S.sectionCount}>{filteredCourses.length}</span>
              </div>
            </div>
            {filteredCourses.length === 0 ? (
              <div style={S.empty}>
                <BookOpen size={32} color="#c7d2fe" />
                <p style={{ color: '#94a3b8', margin: '10px 0 16px', fontSize: 14 }}>No course channels yet. Create your first course channel to start managing students.</p>
                <button style={S.emptyBtn} onClick={() => setShowCreate(true)}><Plus size={13} /> Create Course Channel</button>
              </div>
            ) : (
              <div style={S.grid}>
                {filteredCourses.map(channel => (
                  <CourseChannelCard
                    key={channel.id}
                    channel={channel}
                    onView={() => navigate(`/doctor/channels/${channel.id}`)}
                    onManageStudents={() => setManagingStudents(channel)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Graduation Channels */}
        {(tab === 'overview' || tab === 'graduation') && (
          <section style={S.section}>
            <div style={S.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={16} color="#f59e0b" />
                <h2 style={S.sectionTitle}>Graduation Channels</h2>
                <span style={S.sectionCount}>{filteredGrad.length}</span>
              </div>
            </div>
            {filteredGrad.length === 0 ? (
              <div style={S.empty}>
                <GraduationCap size={32} color="#fde68a" />
                <p style={{ color: '#94a3b8', margin: '10px 0 16px', fontSize: 14 }}>No graduation channels yet. Create your first channel to start supervising students.</p>
                <button style={S.emptyBtn} onClick={() => setShowCreate(true)}><Plus size={13} /> Create Graduation Channel</button>
              </div>
            ) : (
              <div style={S.grid}>
                {filteredGrad.map(project => (
                  <GradProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {managingStudents && (
        <StudentListModal
          students={managingStudents.students}
          channelName={`${managingStudents.name} – ${managingStudents.section}`}
          onClose={() => setManagingStudents(null)}
        />
      )}
      {showCreate && (
        <CreateChannelModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}

      <style>{`input::placeholder{color:#94a3b8;} input:focus{outline:none;border-color:#6366f1!important;} a{text-decoration:none;} button:active{transform:scale(.98);}`}</style>
    </div>
  )
}

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed', top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:         { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  nav:          { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:     { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 16 },
  navLogo:      { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8, flexShrink: 0 },
  logoIconWrap: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  logoText:     { fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent:   { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navLinks:     { display: 'flex', gap: 4, flex: 1, justifyContent: 'center' },
  navLink:      { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#64748b', textDecoration: 'none' },
  navLinkActive:{ color: '#6366f1', background: '#eef2ff', fontWeight: 700 },
  navActions:   { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  navBtn:       { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: 8, textDecoration: 'none' },
  content:      { maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },
  hero:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '24px 28px', background: 'white', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, boxShadow: '0 4px 24px rgba(99,102,241,0.06)', flexWrap: 'wrap', gap: 16 },
  pageTitle:    { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px', fontFamily: 'Syne, sans-serif' },
  pageSubtitle: { fontSize: 13, color: '#64748b', margin: 0 },
  heroStats:    { display: 'flex', gap: 10, flexWrap: 'wrap' as const },
  statCard:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 },
  statValue:    { fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Syne, sans-serif' },
  statLabel:    { fontSize: 11, color: '#94a3b8', margin: '3px 0 0', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  toolbar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' as const },
  tabs:         { display: 'flex', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 3, gap: 2 },
  tab:          { padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  tabActive:    { background: '#eef2ff', color: '#6366f1', fontWeight: 700 },
  searchWrap:   { position: 'relative' as const },
  searchIcon:   { position: 'absolute' as const, left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  searchInput:  { padding: '9px 14px 9px 32px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', width: 200 },
  createBtn:    { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  section:      { marginBottom: 36 },
  sectionHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
  sectionCount: { fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, padding: '2px 8px' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  empty:        { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', background: 'white', border: '1.5px dashed #c7d2fe', borderRadius: 16, textAlign: 'center' as const },
  emptyBtn:     { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
