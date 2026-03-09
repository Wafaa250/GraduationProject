import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Building, BookOpen, Star,
  Edit3, CheckCircle2, Circle, Award, Users, Briefcase,
  ChevronRight, Github, Linkedin, Globe,
  MessageCircle, UserPlus, Zap, Plus, Camera,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillItem { label: string; icon: string }

interface StudentProfile {
  id: string
  fullName: string
  major: string
  faculty: string
  university: string
  studentId: string
  academicYear: string
  gpa: string
  bio: string
  profilePic: string | null
  coverImage: string | null
  lookingFor: string
  preferredRole: string
  availability: string
  languages: string[]
  tools: string[]
  generalSkills: SkillItem[]
  majorSkills: SkillItem[]
  github: string
  linkedin: string
  portfolio: string
  completeness: number
  isOwnProfile: boolean
}

type TabType = 'overview' | 'skills' | 'projects'

// ─── Mock Data ────────────────────────────────────────────────────────────────

// ─── TODO: GET /api/profile/me ───────────────────────────────────────────────
const EMPTY_STUDENT: StudentProfile = {
  id: '',
  fullName: '',
  major: '',
  faculty: '',
  university: '',
  studentId: '',
  academicYear: '',
  gpa: '',
  bio: '',
  profilePic: null,
  coverImage: null,
  lookingFor: '',
  preferredRole: '',
  availability: '',
  languages: [],
  tools: [],
  generalSkills: [],
  majorSkills: [],
  github: '',
  linkedin: '',
  portfolio: '',
  completeness: 0,
  isOwnProfile: true,
}

// ─── TODO: GET /api/profile/me/suggested-teammates ───────────────────────────
const SUGGESTED_TEAMMATES: { id: string; name: string; role: string; major: string; match: number; avatar: string | null }[] = []

// ─── TODO: GET /api/profile/me/completion-tasks ──────────────────────────────
const PROFILE_TASKS = [
  { id: '1', label: 'Add a profile picture', done: false, link: '/edit-profile' },
  { id: '2', label: 'Write a bio', done: false, link: '/edit-profile' },
  { id: '3', label: 'Add your skills', done: false, link: '/edit-profile' },
  { id: '4', label: 'Connect GitHub account', done: false, link: '/edit-profile' },
  { id: '5', label: 'Join a project', done: false, link: '/dashboard' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const student = EMPTY_STUDENT
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const initials = student.fullName
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const gpaNum = parseFloat(student.gpa)
  const isHighGpa = gpaNum >= 3.5

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/dashboard" style={S.navLogo}>
            <span style={{ fontSize: 20, color: '#6EE7B7' }}>⟡</span>
            <span style={S.navLogoText}>Skill<span style={{ color: '#6EE7B7' }}>Swap</span></span>
          </Link>
          <div style={S.navLinks}>
            <Link to="/dashboard" style={S.navLink}>Dashboard</Link>
            <Link to="/profile" style={{ ...S.navLink, ...S.navLinkActive }}>Profile</Link>
            <Link to="/students" style={S.navLink}>Students</Link>
            <Link to="/projects" style={S.navLink}>Projects</Link>
          </div>
          {student.isOwnProfile && (
            <Link to="/edit-profile" style={S.editNavBtn}>
              <Edit3 size={13} /> Edit Profile
            </Link>
          )}
        </div>
      </nav>

      {/* ── COVER BANNER ── */}
      <div style={S.coverBanner}>
        {student.coverImage
          ? <img src={student.coverImage} style={S.coverImg} alt="cover" />
          : <div style={S.coverGradient}>
              {/* Decorative tech grid lines */}
              <div style={S.coverGrid} />
              <div style={S.coverGlow1} />
              <div style={S.coverGlow2} />
              <div style={S.coverBadge}>
                <Zap size={12} style={{ color: '#6EE7B7' }} />
                <span>AI-Powered Team Matching</span>
              </div>
            </div>
        }
        {student.isOwnProfile && (
          <button style={S.changeCoverBtn}>
            <Camera size={13} /> Change Cover
          </button>
        )}
      </div>

      <div style={S.layout}>

        {/* ── SIDEBAR ── */}
        <aside style={S.sidebar}>

          {/* Profile Card */}
          <div style={S.card}>

            {/* Avatar — pulled up over cover */}
            <div style={S.avatarRow}>
              <div style={{ position: 'relative' as const }}>
                {student.profilePic
                  ? <img src={student.profilePic} style={S.avatarImg} alt={student.fullName} />
                  : <div style={S.avatarFallback}>{initials}</div>
                }
                <div style={S.onlineDot} />
              </div>
              {student.isOwnProfile && (
                <Link to="/edit-profile" style={S.editAvatarBtn}>
                  <Edit3 size={12} />
                </Link>
              )}
            </div>

            {/* Name + tags */}
            <div style={S.profileInfo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 4 }}>
                <h1 style={S.name}>{student.fullName}</h1>
              </div>

              {/* Role tag */}
              <div style={S.roleTag}>
                🎯 {student.preferredRole}
              </div>

              <p style={S.headline}>{student.major} · {student.academicYear}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                <Building size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{student.university}</span>
              </div>

              {/* GPA badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ ...S.gpaBadge, background: isHighGpa ? 'rgba(110,231,183,0.1)' : 'rgba(251,191,36,0.1)', borderColor: isHighGpa ? 'rgba(110,231,183,0.3)' : 'rgba(251,191,36,0.3)', color: isHighGpa ? '#6EE7B7' : '#FBBF24' }}>
                  {isHighGpa ? '🏆' : '⭐'} GPA {student.gpa}
                </div>
              </div>

              {student.lookingFor && (
                <div style={S.lookingBadge}>
                  <span style={S.greenPulse} />
                  Open to: {student.lookingFor}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={S.statsRow}>
              <div style={S.statItem}>
                <span style={S.statNum}>{student.generalSkills.length + student.majorSkills.length}</span>
                <span style={S.statLabel}>Skills</span>
              </div>
              <div style={S.statDivider} />
              <div style={S.statItem}>
                <span style={S.statNum}>{student.gpa}</span>
                <span style={S.statLabel}>GPA</span>
              </div>
              <div style={S.statDivider} />
              <div style={S.statItem}>
                <span style={S.statNum}>0</span>
                <span style={S.statLabel}>Projects</span>
              </div>
            </div>

            {/* Buttons */}
            {!student.isOwnProfile ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button style={S.btnConnect}><UserPlus size={13} /> Connect</button>
                <button style={S.btnMessage}><MessageCircle size={13} /> Message</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Link to="/edit-profile" style={{ ...S.btnMessage, textDecoration: 'none', flex: 1, justifyContent: 'center' as const }}>
                  <Edit3 size={13} /> Edit Profile
                </Link>
                <button style={{ ...S.btnMessage, flex: 1, justifyContent: 'center' as const }}>
                  <MessageCircle size={13} /> Share
                </button>
              </div>
            )}
          </div>

          {/* Academic Info */}
          <div style={S.card}>
            <h3 style={S.cardTitle}><GraduationCap size={14} style={{ color: '#6EE7B7' }} /> Academic Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9 }}>
              {[
                { label: 'Student ID', value: student.studentId },
                { label: 'Faculty', value: student.faculty },
                { label: 'Major', value: student.major },
                { label: 'Year', value: student.academicYear },
                { label: 'GPA', value: `${student.gpa} / 4.0`, highlight: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: row.highlight ? '#6EE7B7' : 'rgba(255,255,255,0.8)', textAlign: 'right' as const }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {(student.github || student.linkedin || student.portfolio) && (
            <div style={S.card}>
              <h3 style={S.cardTitle}><Globe size={14} style={{ color: '#6EE7B7' }} /> Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {student.github && (
                  <a href={`https://${student.github}`} target="_blank" rel="noreferrer" style={S.linkItem}>
                    <Github size={13} /> {student.github}
                  </a>
                )}
                {student.linkedin && (
                  <a href={`https://${student.linkedin}`} target="_blank" rel="noreferrer" style={S.linkItem}>
                    <Linkedin size={13} /> {student.linkedin}
                  </a>
                )}
                {student.portfolio && (
                  <a href={`https://${student.portfolio}`} target="_blank" rel="noreferrer" style={S.linkItem}>
                    <Globe size={13} /> {student.portfolio}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Profile Strength */}
          {student.isOwnProfile && (
            <div style={S.card}>
              <h3 style={S.cardTitle}><CheckCircle2 size={14} style={{ color: '#6EE7B7' }} /> Profile Strength</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <div style={S.progressTrack}>
                  <div style={{ ...S.progressFill, width: `${student.completeness}%` }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#6EE7B7', minWidth: 34 }}>{student.completeness}%</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' }}>
                {student.completeness >= 80 ? '🔥 Strong profile!' : 'Complete your profile to get better matches'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9 }}>
                {PROFILE_TASKS.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {task.done
                      ? <CheckCircle2 size={14} style={{ color: '#6EE7B7', flexShrink: 0 }} />
                      : <Circle size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.65)', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.4 : 1 }}>
                      {task.label}
                    </span>
                    {!task.done && (
                      <Link to={task.link} style={{ fontSize: 11, color: '#6EE7B7', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>Do it</Link>
                    )}
                  </div>
                ))}
              </div>
              <Link to="/edit-profile" style={S.completeLink}>
                Complete your profile <ChevronRight size={11} />
              </Link>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>

          {/* Tabs */}
          <div style={S.tabs}>
            {(['overview', 'skills', 'projects'] as TabType[]).map(tab => (
              <button key={tab}
                style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}>
                {tab === 'overview' ? '📋 Overview' : tab === 'skills' ? '⚡ Skills' : '📁 Projects'}
                {activeTab === tab && <div style={S.tabUnderline} />}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {student.bio && (
                <Section title="About" icon={<BookOpen size={14} />}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, margin: 0 }}>{student.bio}</p>
                </Section>
              )}

              <Section title="Work Style" icon={<Briefcase size={14} />}>
                <div style={S.workGrid}>
                  <WorkItem icon="🎯" label="Preferred Role" value={student.preferredRole} />
                  <WorkItem icon="⏰" label="Weekly Availability" value={student.availability} />
                  <WorkItem icon="🔄" label="Team Preference" value="Flexible — can lead or contribute" />
                  <WorkItem icon="🔍" label="Looking For" value={student.lookingFor} />
                </div>
              </Section>

              {student.tools.length > 0 && (
                <Section title="Tools & Technologies" icon={<Award size={14} />}>
                  <div style={S.chipsWrap}>
                    {student.tools.map(t => <span key={t} style={S.toolChip}>{t}</span>)}
                  </div>
                </Section>
              )}

              <Section title="Languages" icon={<Globe size={14} />}>
                <div style={S.chipsWrap}>
                  {student.languages.map(l => <span key={l} style={S.langChip}>{l}</span>)}
                </div>
              </Section>

              {/* ── SUGGESTED TEAMMATES ── */}
              <Section title="Suggested Teammates" icon={<Zap size={14} />}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 14px' }}>
                  AI-matched based on your skills and project goals
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {SUGGESTED_TEAMMATES.map((tm, i) => (
                    <div key={tm.id} style={S.teammateRow}>
                      <div style={{ ...S.tmAvatar, background: i === 0 ? 'linear-gradient(135deg,#6EE7B7,#34D399)' : i === 1 ? 'linear-gradient(135deg,#A78BFA,#7C3AED)' : 'linear-gradient(135deg,#60A5FA,#2563EB)' }}>
                        {tm.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{tm.name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{tm.role} · {tm.major}</p>
                      </div>
                      <div style={{ ...S.matchBadge, background: tm.match >= 90 ? 'rgba(110,231,183,0.12)' : 'rgba(167,139,250,0.12)', color: tm.match >= 90 ? '#6EE7B7' : '#A78BFA' }}>
                        <Zap size={10} /> {tm.match}%
                      </div>
                      <Link to={`/student/${tm.id}`} style={S.tmViewBtn}>View</Link>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard" style={S.seeAllBtn}>
                  See all suggested teammates <ChevronRight size={12} />
                </Link>
              </Section>
            </>
          )}

          {/* ── SKILLS ── */}
          {activeTab === 'skills' && (
            <>
              <Section title="General Skills" icon={<Users size={14} />}>
                <div style={S.skillCardsGrid}>
                  {student.generalSkills.map((sk, i) => <SkillCard key={i} skill={sk} color="#6EE7B7" />)}
                </div>
              </Section>
              <Section title="Major Skills" icon={<Star size={14} />}>
                <div style={S.skillCardsGrid}>
                  {student.majorSkills.map((sk, i) => <SkillCard key={i} skill={sk} color="#A78BFA" />)}
                </div>
              </Section>
            </>
          )}

          {/* ── PROJECTS ── */}
          {activeTab === 'projects' && (
            <Section title="Projects" icon={<Briefcase size={14} />}>
              <div style={{ padding: '32px 20px', textAlign: 'center' as const }}>
                <span style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>📂</span>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>No projects yet</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', lineHeight: 1.6 }}>
                  {student.isOwnProfile
                    ? 'Showcase your graduation project or any other work here.'
                    : "This student hasn't added any projects yet."}
                </p>
                {student.isOwnProfile && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' as const, flexWrap: 'wrap' as const }}>
                    <button style={S.addProjectBtn}>
                      <Plus size={14} /> Add Graduation Project
                    </button>
                    <Link to="/dashboard" style={S.exploreBtn}>
                      Explore Projects →
                    </Link>
                  </div>
                )}
              </div>
            </Section>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={S.card}>
      <h3 style={S.cardTitle}><span style={{ color: '#6EE7B7' }}>{icon}</span>{title}</h3>
      {children}
    </div>
  )
}

function WorkItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={S.workItem}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 3px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

function SkillCard({ skill, color }: { skill: SkillItem; color: string }) {
  return (
    <div style={{ padding: '14px 12px', border: `1px solid ${color}20`, background: `${color}08`, borderRadius: 12, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' as const, gap: 6 }}>
      <span style={{ fontSize: 22 }}>{skill.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color, textAlign: 'center' as const, lineHeight: 1.3 }}>{skill.label}</span>
      <div style={{ height: 3, background: `${color}15`, borderRadius: 2, overflow: 'hidden', width: '100%', marginTop: 2 }}>
        <div style={{ height: '100%', width: '75%', background: color, borderRadius: 2, opacity: 0.5 }} />
      </div>
    </div>
  )
}

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.04) 0%, transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,183,0.04) 0%, transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, #080d1a 0%, #0d1628 60%, #080d1a 100%)', fontFamily: "'Segoe UI', Tahoma, sans-serif", color: '#fff', paddingBottom: 60 },

  // Nav
  nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,13,26,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 20 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 },
  navLogoText: { fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: 0.5 },
  navLinks: { display: 'flex', gap: 4, flex: 1, justifyContent: 'center' },
  navLink: { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' },
  navLinkActive: { color: '#fff', background: 'rgba(255,255,255,0.07)' },
  editNavBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 9, color: '#6EE7B7', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0 },

  // Cover Banner
  coverBanner: { position: 'relative', height: 180, overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverGradient: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a1628 0%, #0d2040 30%, #0a1a35 60%, #06111f 100%)', position: 'relative', overflow: 'hidden' },
  coverGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(110,231,183,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' },
  coverGlow1: { position: 'absolute', top: -60, left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  coverGlow2: { position: 'absolute', bottom: -80, right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', pointerEvents: 'none' },
  coverBadge: { position: 'absolute', bottom: 16, right: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 20, fontSize: 11, color: '#6EE7B7', fontWeight: 600 },
  changeCoverBtn: { position: 'absolute', top: 12, right: 14, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit' },

  // Layout
  layout: { maxWidth: 1100, margin: '0 auto', padding: '0 24px 0', display: 'grid', gridTemplateColumns: '290px 1fr', gap: 20, alignItems: 'start' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 76, marginTop: -48 },

  // Cards
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)' },
  cardTitle: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.07em' },

  // Profile card
  avatarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -38, marginBottom: 12 },
  avatarImg: { width: 88, height: 88, borderRadius: '50%', border: '4px solid #0d1628', objectFit: 'cover' },
  avatarFallback: { width: 88, height: 88, borderRadius: '50%', border: '4px solid #0d1628', background: 'linear-gradient(135deg, #6EE7B7, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#0f172a' },
  onlineDot: { position: 'absolute', bottom: 5, right: 5, width: 13, height: 13, borderRadius: '50%', background: '#6EE7B7', border: '2.5px solid #0d1628' },
  editAvatarBtn: { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' },

  profileInfo: { marginBottom: 14 },
  name: { fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 },
  roleTag: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 8, fontSize: 12, color: '#6EE7B7', fontWeight: 700, margin: '6px 0 8px' },
  headline: { fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px', fontWeight: 500 },
  gpaBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  lookingBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(110,231,183,0.07)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: 20, fontSize: 11, color: '#6EE7B7', fontWeight: 600 },
  greenPulse: { width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', flexShrink: 0 },

  statsRow: { display: 'flex', alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 },
  statItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statNum: { fontSize: 17, fontWeight: 800, color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  statDivider: { width: 1, height: 28, background: 'rgba(255,255,255,0.07)' },

  btnConnect: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'linear-gradient(135deg, #6EE7B7, #34D399)', color: '#0f172a', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  btnMessage: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  linkItem: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6EE7B7', textDecoration: 'none', fontWeight: 500 },
  progressTrack: { flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6EE7B7, #34D399)', borderRadius: 3, transition: 'width 0.6s ease' },
  completeLink: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6EE7B7', fontWeight: 600, textDecoration: 'none', marginTop: 12 },

  // Tabs
  tabs: { display: 'flex', gap: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 4, marginTop: 20 },
  tab: { flex: 1, padding: '9px 16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 9, position: 'relative', transition: 'all 0.2s', fontFamily: 'inherit' },
  tabActive: { background: 'rgba(255,255,255,0.07)', color: '#fff' },
  tabUnderline: { position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: '#6EE7B7', borderRadius: 1 },

  // Overview
  workGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  workItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' },
  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  toolChip: { padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 },
  langChip: { padding: '5px 12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 20, fontSize: 12, color: '#FBBF24', fontWeight: 600 },

  // Suggested Teammates
  teammateRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 },
  tmAvatar: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0f172a', flexShrink: 0 },
  matchBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  tmViewBtn: { padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 },
  seeAllBtn: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6EE7B7', fontWeight: 600, textDecoration: 'none', marginTop: 12 },

  // Skills
  skillCardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },

  // Projects
  addProjectBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #6EE7B7, #34D399)', color: '#0f172a', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  exploreBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
}