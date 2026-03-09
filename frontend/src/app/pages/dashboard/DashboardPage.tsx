import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, Search, Settings, ChevronRight, Zap, Users,
  BookOpen, TrendingUp, Star, ArrowRight, Clock,
  CheckCircle2, Circle, Briefcase, MessageCircle,
  Award, Filter, MoreHorizontal, Plus, Activity
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CURRENT_USER = {
  fullName: 'Mohammad Abdullah',
  major: 'Computer Engineering',
  university: 'An-Najah National University',
  academicYear: 'Third Year',
  profilePic: null,
  completeness: 78,
  generalSkills: ['Communication', 'Teamwork', 'Problem Solving'],
  majorSkills: ['Programming', 'Web Development', 'AI / Machine Learning'],
}

const SUGGESTED_TEAMMATES = [
  {
    id: '1', name: 'Sara Khalil', major: 'Computer Science', year: 'Third Year',
    skills: ['UI/UX Design', 'React', 'Figma'], match: 94, avatar: null, available: true,
  },
  {
    id: '2', name: 'Ahmed Nasser', major: 'Data Science', year: 'Fourth Year',
    skills: ['Python', 'Machine Learning', 'Data Analysis'], match: 88, avatar: null, available: true,
  },
  {
    id: '3', name: 'Lina Haddad', major: 'Software Engineering', year: 'Third Year',
    skills: ['Node.js', 'Databases', 'DevOps'], match: 82, avatar: null, available: false,
  },
  {
    id: '4', name: 'Omar Barakat', major: 'Cyber Security', year: 'Fourth Year',
    skills: ['Penetration Testing', 'Networking', 'Linux'], match: 76, avatar: null, available: true,
  },
]

const SUGGESTED_PROJECTS = [
  {
    id: '1', title: 'Smart Campus Navigation App',
    desc: 'Mobile app using AI to help students navigate university buildings and find resources.',
    tags: ['Mobile Dev', 'AI', 'React Native'],
    teamSize: 4, filled: 2, supervisor: 'Dr. Ahmad Khalil',
    deadline: '3 months', match: 91,
  },
  {
    id: '2', title: 'E-Learning Platform for Schools',
    desc: 'Web platform connecting teachers and students with interactive content and assessments.',
    tags: ['Web Dev', 'UI/UX', 'Database'],
    teamSize: 5, filled: 3, supervisor: 'Dr. Sana Jaber',
    deadline: '4 months', match: 85,
  },
  {
    id: '3', title: 'Student Mental Health Tracker',
    desc: 'Anonymous platform for students to track wellbeing and access support resources.',
    tags: ['Psychology', 'Data Analysis', 'Mobile Dev'],
    teamSize: 3, filled: 1, supervisor: 'Dr. Rima Nassar',
    deadline: '2 months', match: 72,
  },
]

const RECENT_ACTIVITY = [
  { id: '1', text: 'Your profile was viewed by 3 students', time: '2h ago', icon: '👁️', type: 'view' },
  { id: '2', text: 'New project match: Smart Campus App (91%)', time: '5h ago', icon: '⚡', type: 'match' },
  { id: '3', text: 'Sara Khalil wants to connect with you', time: '1d ago', icon: '🤝', type: 'connect' },
  { id: '4', text: 'Your skills profile was analyzed by AI', time: '2d ago', icon: '🤖', type: 'ai' },
]

const PROFILE_TASKS = [
  { id: '1', label: 'Add a profile picture', done: false, link: '/edit-profile' },
  { id: '2', label: 'Write a bio', done: false, link: '/edit-profile' },
  { id: '3', label: 'Add your skills', done: true, link: '/edit-profile' },
  { id: '4', label: 'Connect GitHub account', done: false, link: '/edit-profile' },
  { id: '5', label: 'Join a project', done: false, link: '/projects' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'projects' | 'teammates'>('all')
  const user = CURRENT_USER
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── TOP NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          {/* Logo */}
          <Link to="/" style={S.navLogo}>
            <div style={S.logoIcon}>⟡</div>
            <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
          </Link>

          {/* Search */}
          <div style={S.searchWrap}>
            <Search size={14} style={S.searchIcon} />
            <input
              style={S.searchInput}
              placeholder="Search students, projects, skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Nav actions */}
          <div style={S.navActions}>
            <button style={S.navBtn} title="Notifications">
              <Bell size={17} />
              <span style={S.notifDot} />
            </button>
            <button style={S.navBtn} title="Messages">
              <MessageCircle size={17} />
            </button>
            <Link to="/settings" style={S.navBtn} title="Settings">
              <Settings size={17} />
            </Link>
            <Link to="/profile" style={S.navAvatar}>
              {user.profilePic
                ? <img src={user.profilePic} style={S.navAvatarImg} alt="" />
                : <div style={S.navAvatarFallback}>
                    {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
              }
            </Link>
          </div>
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <div style={S.content}>

        {/* ── HERO WELCOME ── */}
        <div style={S.hero}>
          <div style={S.heroLeft}>
            <p style={S.greetingText}>{greeting} 👋</p>
            <h1 style={S.heroName}>
              Welcome back, <span style={S.heroNameAccent}>{user.fullName.split(' ')[0]}</span>
            </h1>
            <p style={S.heroSub}>
              {user.major} · {user.academicYear} · {user.university}
            </p>
            <div style={S.heroSkills}>
              {[...user.generalSkills.slice(0, 2), ...user.majorSkills.slice(0, 2)].map(s => (
                <span key={s} style={S.heroSkillChip}>{s}</span>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={S.heroStats}>
            <StatCard icon={<Users size={18} />} label="Suggested Teammates" value="12" color="#6EE7B7" />
            <StatCard icon={<Briefcase size={18} />} label="Matched Projects" value="5" color="#A78BFA" />
            <StatCard icon={<Star size={18} />} label="Profile Views" value="24" color="#FBBF24" />
            <StatCard icon={<Activity size={18} />} label="AI Match Score" value="88%" color="#60A5FA" />
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={S.grid}>

          {/* ── LEFT COLUMN ── */}
          <div style={S.leftCol}>

            {/* Profile Completeness */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <CheckCircle2 size={15} style={{ color: '#6EE7B7' }} />
                  Profile Strength
                </h3>
                <Link to="/edit-profile" style={S.cardAction}>Edit <ChevronRight size={12} /></Link>
              </div>

              <div style={S.completenessRow}>
                <div style={S.completenessTrack}>
                  <div style={{ ...S.completenessFill, width: `${user.completeness}%` }} />
                </div>
                <span style={S.completenessPct}>{user.completeness}%</span>
              </div>
              <p style={S.completenessLabel}>
                {user.completeness >= 80 ? '🔥 Strong profile!' : `Complete your profile to get better matches`}
              </p>

              <div style={S.tasksList}>
                {PROFILE_TASKS.map(task => (
                  <div key={task.id} style={S.taskItem}>
                    {task.done
                      ? <CheckCircle2 size={15} style={{ color: '#6EE7B7', flexShrink: 0 }} />
                      : <Circle size={15} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    }
                    <span style={{ ...S.taskLabel, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.4 : 1 }}>
                      {task.label}
                    </span>
                    {!task.done && (
                      <Link to={task.link} style={S.taskAction}>Do it</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={S.card}>
              <div style={S.cardHeader}>
                <h3 style={S.cardTitle}>
                  <Activity size={15} style={{ color: '#6EE7B7' }} />
                  Recent Activity
                </h3>
              </div>
              <div style={S.activityList}>
                {RECENT_ACTIVITY.map(item => (
                  <div key={item.id} style={S.activityItem}>
                    <div style={{
                      ...S.activityIcon,
                      background: item.type === 'match' ? 'rgba(110,231,183,0.1)'
                        : item.type === 'connect' ? 'rgba(167,139,250,0.1)'
                        : 'rgba(255,255,255,0.05)'
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={S.activityText}>{item.text}</p>
                      <p style={S.activityTime}>{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={S.rightCol}>

            {/* Filter tabs */}
            <div style={S.filterRow}>
              {(['all', 'teammates', 'projects'] as const).map(f => (
                <button key={f} style={{ ...S.filterBtn, ...(activeFilter === f ? S.filterBtnActive : {}) }}
                  onClick={() => setActiveFilter(f)}>
                  {f === 'all' ? '⚡ All Matches' : f === 'teammates' ? '👥 Teammates' : '📁 Projects'}
                </button>
              ))}
            </div>

            {/* Suggested Teammates */}
            {(activeFilter === 'all' || activeFilter === 'teammates') && (
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}>
                    <Users size={15} style={{ color: '#6EE7B7' }} />
                    Suggested Teammates
                  </h3>
                  <Link to="/students" style={S.cardAction}>See all <ChevronRight size={12} /></Link>
                </div>

                <div style={S.teammatesList}>
                  {SUGGESTED_TEAMMATES.map((tm, i) => (
                    <div key={tm.id} style={{ ...S.teammateCard, animationDelay: `${i * 0.08}s` }}>
                      {/* Avatar */}
                      <div style={S.tmAvatarWrap}>
                        <div style={S.tmAvatar}>
                          {tm.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ ...S.tmOnline, background: tm.available ? '#6EE7B7' : 'rgba(255,255,255,0.2)' }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.tmNameRow}>
                          <span style={S.tmName}>{tm.name}</span>
                          <div style={{ ...S.matchBadge, background: tm.match >= 90 ? 'rgba(110,231,183,0.15)' : tm.match >= 80 ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)', color: tm.match >= 90 ? '#6EE7B7' : tm.match >= 80 ? '#A78BFA' : 'rgba(255,255,255,0.5)' }}>
                            <Zap size={10} /> {tm.match}%
                          </div>
                        </div>
                        <p style={S.tmSub}>{tm.major} · {tm.year}</p>
                        <div style={S.tmSkills}>
                          {tm.skills.slice(0, 2).map(s => (
                            <span key={s} style={S.tmSkillChip}>{s}</span>
                          ))}
                          {tm.skills.length > 2 && (
                            <span style={{ ...S.tmSkillChip, opacity: 0.5 }}>+{tm.skills.length - 2}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={S.tmActions}>
                        <Link to={`/student/${tm.id}`} style={S.tmViewBtn}>View</Link>
                        <button style={S.tmConnectBtn}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Projects */}
            {(activeFilter === 'all' || activeFilter === 'projects') && (
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}>
                    <Briefcase size={15} style={{ color: '#A78BFA' }} />
                    Matched Projects
                  </h3>
                  <Link to="/projects" style={S.cardAction}>See all <ChevronRight size={12} /></Link>
                </div>

                <div style={S.projectsList}>
                  {SUGGESTED_PROJECTS.map((proj, i) => (
                    <div key={proj.id} style={{ ...S.projectCard, animationDelay: `${i * 0.1}s` }}>
                      <div style={S.projectTop}>
                        <div style={{ flex: 1 }}>
                          <div style={S.projectTitleRow}>
                            <h4 style={S.projectTitle}>{proj.title}</h4>
                            <div style={{ ...S.matchBadge, background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}>
                              <Zap size={10} /> {proj.match}%
                            </div>
                          </div>
                          <p style={S.projectDesc}>{proj.desc}</p>
                        </div>
                      </div>

                      <div style={S.projectTags}>
                        {proj.tags.map(t => (
                          <span key={t} style={S.projectTag}>{t}</span>
                        ))}
                      </div>

                      <div style={S.projectMeta}>
                        <div style={S.projectMetaItem}>
                          <Users size={12} style={{ opacity: 0.5 }} />
                          <span>{proj.filled}/{proj.teamSize} members</span>
                        </div>
                        <div style={S.projectMetaItem}>
                          <Clock size={12} style={{ opacity: 0.5 }} />
                          <span>{proj.deadline}</span>
                        </div>
                        <div style={S.projectMetaItem}>
                          <BookOpen size={12} style={{ opacity: 0.5 }} />
                          <span>{proj.supervisor}</span>
                        </div>
                      </div>

                      {/* Team slots visual */}
                      <div style={S.teamSlotsRow}>
                        <div style={S.teamSlots}>
                          {Array.from({ length: proj.teamSize }).map((_, idx) => (
                            <div key={idx} style={{
                              ...S.teamSlot,
                              background: idx < proj.filled ? 'linear-gradient(135deg,#6EE7B7,#34D399)' : 'rgba(255,255,255,0.06)',
                              border: idx < proj.filled ? 'none' : '1px dashed rgba(255,255,255,0.15)',
                            }} />
                          ))}
                          <span style={S.teamSlotsLabel}>{proj.teamSize - proj.filled} spot{proj.teamSize - proj.filled !== 1 ? 's' : ''} left</span>
                        </div>
                        <button style={S.projectApplyBtn}>
                          Apply <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string
}) {
  return (
    <div style={{ ...S.statCard, borderColor: `${color}20` }}>
      <div style={{ ...S.statCardIcon, background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p style={S.statCardValue}>{value}</p>
        <p style={S.statCardLabel}>{label}</p>
      </div>
    </div>
  )
}

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed', top: -300, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.04) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.02) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #070e1a 0%, #0b1525 50%, #07101e 100%)', fontFamily: "'Segoe UI', Tahoma, sans-serif", color: '#fff', position: 'relative' },

  // Nav
  nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7,14,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8, flexShrink: 0 },
  logoIcon: { fontSize: 22, color: '#6EE7B7' },
  logoText: { fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: 0.5 },
  logoAccent: { color: '#6EE7B7' },

  searchWrap: { flex: 1, maxWidth: 420, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '8px 14px 8px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },

  navActions: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  navBtn: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', borderRadius: 8, position: 'relative', transition: 'all 0.2s', textDecoration: 'none' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#6EE7B7', border: '1.5px solid #07101e' },
  navAvatar: { width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', marginLeft: 4, textDecoration: 'none', flexShrink: 0 },
  navAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  navAvatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6EE7B7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#0f172a' },

  // Content
  content: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px', position: 'relative', zIndex: 1 },

  // Hero
  hero: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 32, padding: '28px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, backdropFilter: 'blur(12px)' },
  heroLeft: { flex: 1 },
  greetingText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', fontWeight: 500 },
  heroName: { fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' },
  heroNameAccent: { background: 'linear-gradient(135deg,#6EE7B7,#34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px' },
  heroSkills: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  heroSkillChip: { padding: '4px 10px', background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 20, fontSize: 11, color: '#6EE7B7', fontWeight: 600 },

  heroStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 },
  statCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid', borderRadius: 14 },
  statCardIcon: { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statCardValue: { fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 2px' },
  statCardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontWeight: 500 },

  // Main grid
  grid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Card
  card: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px', backdropFilter: 'blur(10px)' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  cardAction: { display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#6EE7B7', fontWeight: 600, textDecoration: 'none' },

  // Profile completeness
  completenessRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  completenessTrack: { flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  completenessFill: { height: '100%', background: 'linear-gradient(90deg,#6EE7B7,#34D399)', borderRadius: 3, transition: 'width 0.6s ease' },
  completenessPct: { fontSize: 14, fontWeight: 800, color: '#6EE7B7', minWidth: 36 },
  completenessLabel: { fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 14px' },

  tasksList: { display: 'flex', flexDirection: 'column', gap: 10 },
  taskItem: { display: 'flex', alignItems: 'center', gap: 10 },
  taskLabel: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  taskAction: { fontSize: 11, color: '#6EE7B7', fontWeight: 700, textDecoration: 'none', flexShrink: 0 },

  // Activity
  activityList: { display: 'flex', flexDirection: 'column', gap: 12 },
  activityItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  activityIcon: { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  activityText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '0 0 3px', lineHeight: 1.4 },
  activityTime: { fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 },

  // Filters
  filterRow: { display: 'flex', gap: 6, marginBottom: 4 },
  filterBtn: { padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
  filterBtnActive: { background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)', color: '#6EE7B7' },

  // Teammates
  teammatesList: { display: 'flex', flexDirection: 'column', gap: 12 },
  teammateCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, transition: 'all 0.2s', animation: 'fadeUp 0.4s ease both' },
  tmAvatarWrap: { position: 'relative', flexShrink: 0 },
  tmAvatar: { width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#6EE7B7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0f172a' },
  tmOnline: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', border: '2px solid #0b1525' },
  tmNameRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 },
  tmName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  tmSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' },
  tmSkills: { display: 'flex', gap: 5, flexWrap: 'wrap' },
  tmSkillChip: { padding: '2px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  tmActions: { display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 },
  tmViewBtn: { padding: '5px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textDecoration: 'none', textAlign: 'center' },
  tmConnectBtn: { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 7, color: '#6EE7B7', cursor: 'pointer' },

  // Match badge
  matchBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, flexShrink: 0 },

  // Projects
  projectsList: { display: 'flex', flexDirection: 'column', gap: 14 },
  projectCard: { padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, animation: 'fadeUp 0.4s ease both' },
  projectTop: { display: 'flex', gap: 12, marginBottom: 10 },
  projectTitleRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  projectTitle: { fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 },
  projectDesc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 },
  projectTags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  projectTag: { padding: '3px 9px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, fontSize: 11, color: '#A78BFA', fontWeight: 500 },
  projectMeta: { display: 'flex', gap: 16, marginBottom: 14 },
  projectMetaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  teamSlotsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  teamSlots: { display: 'flex', alignItems: 'center', gap: 5 },
  teamSlot: { width: 20, height: 20, borderRadius: '50%' },
  teamSlotsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 6 },
  projectApplyBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'linear-gradient(135deg,#6EE7B7,#34D399)', color: '#0f172a', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
