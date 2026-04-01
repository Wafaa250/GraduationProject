// src/app/pages/doctor/DoctorDashboardPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Users, BookMarked, CheckCircle2, Clock, ChevronRight, Bell, LogOut, Settings, Star, Sparkles } from 'lucide-react'

type Tab = 'suggestions' | 'requests' | 'active'

// ── Mock data ────────────────────────────────────────────────────────────────

const suggestedProjects = [
  {
    id: 'sp1',
    title: 'AI-Based Medical Image Diagnosis',
    field: 'Machine Learning · Healthcare',
    matchScore: 96,
    reason: 'Matches your expertise in deep learning and biomedical data analysis.',
    studentsCount: 3,
    skills: ['Python', 'CNN', 'TensorFlow', 'Medical Imaging'],
  },
  {
    id: 'sp2',
    title: 'Smart Traffic Management System',
    field: 'Computer Vision · IoT',
    matchScore: 88,
    reason: 'Aligns with your published research on real-time object detection.',
    studentsCount: 4,
    skills: ['OpenCV', 'YOLO', 'Embedded Systems', 'Data Streaming'],
  },
  {
    id: 'sp3',
    title: 'NLP-Powered Academic Summarizer',
    field: 'Natural Language Processing',
    matchScore: 82,
    reason: 'Relevant to your background in text mining and information retrieval.',
    studentsCount: 3,
    skills: ['BERT', 'Python', 'Transformer Models', 'REST API'],
  },
]

const supervisionRequests = [
  {
    id: 'req1',
    projectTitle: 'Blockchain-Based Certificate Verification',
    team: ['Sana M.', 'Rami K.', 'Omar H.'],
    teamSkills: ['Solidity', 'React', 'Node.js'],
    matchScore: 91,
    submittedAt: '2 hours ago',
  },
  {
    id: 'req2',
    projectTitle: 'Federated Learning for Privacy-Preserving Analytics',
    team: ['Lara A.', 'Yousef B.'],
    teamSkills: ['Python', 'PyTorch', 'Distributed Systems'],
    matchScore: 78,
    submittedAt: '1 day ago',
  },
]

const activeProjects = [
  {
    id: 'ap1',
    title: 'Deep Fake Detection Using GAN',
    team: ['Hana S.', 'Karim N.', 'Dina R.'],
    progress: 65,
    nextMilestone: 'Model evaluation report — due Apr 10',
    status: 'On Track',
  },
  {
    id: 'ap2',
    title: 'Multilingual Sentiment Analysis',
    team: ['Adam L.', 'Nour F.'],
    progress: 40,
    nextMilestone: 'Dataset labeling complete — due Apr 5',
    status: 'Needs Attention',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function DoctorDashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('suggestions')

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const doctorName = localStorage.getItem('name') || 'Doctor'

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
            <span style={{ ...S.navLink, ...S.navLinkActive }}>Supervisor Panel</span>
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
            <h1 style={S.pageTitle}>Supervisor Dashboard</h1>
            <p style={S.pageSubtitle}>Welcome back, {doctorName} · AI has matched you with new projects and students</p>
          </div>
          <div style={S.heroStats}>
            {[
              { label: 'AI SUGGESTIONS', value: suggestedProjects.length, color: '#6366f1', icon: <Sparkles size={14} color="#6366f1" /> },
              { label: 'REQUESTS', value: supervisionRequests.length, color: '#f59e0b', icon: <Clock size={14} color="#f59e0b" /> },
              { label: 'ACTIVE', value: activeProjects.length, color: '#10b981', icon: <CheckCircle2 size={14} color="#10b981" /> },
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

        {/* Tabs */}
        <div style={S.toolbar}>
          <div style={S.tabs}>
            {([
              { key: 'suggestions', label: 'AI Suggestions', icon: <Sparkles size={13} /> },
              { key: 'requests',    label: 'Supervision Requests', icon: <Clock size={13} /> },
              { key: 'active',      label: 'Under Supervision', icon: <CheckCircle2 size={13} /> },
            ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
              <button key={t.key} style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }} onClick={() => setTab(t.key)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── AI Suggestions ── */}
        {tab === 'suggestions' && (
          <section style={S.section}>
            <SectionHeader icon={<Sparkles size={15} color="#6366f1" />} title="AI-Suggested Projects" count={suggestedProjects.length}
              subtitle="Projects matched to your expertise by the AI" />
            <div style={S.cardList}>
              {suggestedProjects.map(p => (
                <div key={p.id} style={S.card}>
                  <div style={S.cardTop}>
                    <div style={{ flex: 1 }}>
                      <div style={S.cardField}>{p.field}</div>
                      <h3 style={S.cardTitle}>{p.title}</h3>
                      <p style={S.cardReason}>
                        <Brain size={12} style={{ marginRight: 4, flexShrink: 0 }} />
                        {p.reason}
                      </p>
                    </div>
                    <MatchBadge score={p.matchScore} />
                  </div>
                  <div style={S.cardMeta}>
                    <div style={S.skillTags}>
                      {p.skills.map(s => <span key={s} style={S.skillTag}>{s}</span>)}
                    </div>
                    <div style={S.cardActions}>
                      <span style={S.metaText}><Users size={12} /> {p.studentsCount} students</span>
                      <button style={S.btnPrimary}>Accept Supervision <ChevronRight size={13} /></button>
                      <button style={S.btnSecondary}>View Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Supervision Requests ── */}
        {tab === 'requests' && (
          <section style={S.section}>
            <SectionHeader icon={<Clock size={15} color="#f59e0b" />} title="Supervision Requests" count={supervisionRequests.length}
              subtitle="Student teams requesting your supervision" />
            <div style={S.cardList}>
              {supervisionRequests.map(r => (
                <div key={r.id} style={S.card}>
                  <div style={S.cardTop}>
                    <div style={{ flex: 1 }}>
                      <h3 style={S.cardTitle}>{r.projectTitle}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <Users size={13} color="#94a3b8" />
                        <span style={S.metaText}>{r.team.join(', ')}</span>
                      </div>
                      <p style={{ ...S.cardReason, marginTop: 6 }}>
                        <Clock size={12} style={{ marginRight: 4 }} />
                        Submitted {r.submittedAt}
                      </p>
                    </div>
                    <MatchBadge score={r.matchScore} />
                  </div>
                  <div style={S.cardMeta}>
                    <div style={S.skillTags}>
                      {r.teamSkills.map(s => <span key={s} style={S.skillTag}>{s}</span>)}
                    </div>
                    <div style={S.cardActions}>
                      <button style={S.btnPrimary}>Accept <ChevronRight size={13} /></button>
                      <button style={{ ...S.btnSecondary, color: '#ef4444', borderColor: '#fecaca' }}>Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Active Projects ── */}
        {tab === 'active' && (
          <section style={S.section}>
            <SectionHeader icon={<BookMarked size={15} color="#10b981" />} title="Projects Under Supervision" count={activeProjects.length}
              subtitle="Track progress and guide your supervised teams" />
            <div style={S.cardList}>
              {activeProjects.map(p => (
                <div key={p.id} style={S.card}>
                  <div style={S.cardTop}>
                    <div style={{ flex: 1 }}>
                      <h3 style={S.cardTitle}>{p.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <Users size={13} color="#94a3b8" />
                        <span style={S.metaText}>{p.team.join(', ')}</span>
                      </div>
                    </div>
                    <span style={{ ...S.statusBadge, ...(p.status === 'On Track' ? S.statusGreen : S.statusAmber) }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={S.metaText}>Progress</span>
                      <span style={{ ...S.metaText, fontWeight: 700, color: '#0f172a' }}>{p.progress}%</span>
                    </div>
                    <div style={S.progressBg}>
                      <div style={{ ...S.progressBar, width: `${p.progress}%`, background: p.status === 'On Track' ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
                    </div>
                    <p style={{ ...S.cardReason, marginTop: 10 }}>
                      <Star size={12} style={{ marginRight: 4 }} />
                      Next: {p.nextMilestone}
                    </p>
                  </div>
                  <div style={{ ...S.cardActions, marginTop: 14 }}>
                    <button style={S.btnPrimary}>View Team <ChevronRight size={13} /></button>
                    <button style={S.btnSecondary}>Give Feedback</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
      <style>{`input::placeholder{color:#94a3b8;} input:focus{outline:none;} a{text-decoration:none;} button:active{transform:scale(.98);}`}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, subtitle }: { icon: React.ReactNode; title: string; count: number; subtitle: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon}
        <h2 style={S.sectionTitle}>{title}</h2>
        <span style={S.sectionCount}>{count}</span>
      </div>
      <p style={S.metaText}>{subtitle}</p>
    </div>
  )
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#6366f1' : '#f59e0b'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px', background: '#f8fafc', border: `1.5px solid ${color}22`, borderRadius: 12, flexShrink: 0 }}>
      <span style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{score}%</span>
      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>AI Match</span>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:         { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  nav:          { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:     { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 16 },
  navLogo:      { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8, flexShrink: 0 },
  logoIconWrap: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  logoText:     { fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent:   { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navLinks:     { display: 'flex', gap: 4, flex: 1, justifyContent: 'center' },
  navLink:      { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#64748b' },
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

  toolbar:      { marginBottom: 20 },
  tabs:         { display: 'inline-flex', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 3, gap: 2 },
  tab:          { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  tabActive:    { background: '#eef2ff', color: '#6366f1', fontWeight: 700 },

  section:      { marginBottom: 36 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
  sectionCount: { fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, padding: '2px 8px' },

  cardList:     { display: 'flex', flexDirection: 'column' as const, gap: 14 },
  card:         { background: 'white', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 18, padding: '20px 24px', boxShadow: '0 2px 12px rgba(99,102,241,0.05)' },
  cardTop:      { display: 'flex', gap: 16, alignItems: 'flex-start' },
  cardField:    { fontSize: 11, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 },
  cardTitle:    { fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 },
  cardReason:   { display: 'flex', alignItems: 'flex-start', fontSize: 13, color: '#64748b', margin: '8px 0 0', lineHeight: 1.5 },
  cardMeta:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap' as const, gap: 10 },
  cardActions:  { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
  skillTags:    { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  skillTag:     { fontSize: 11, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '3px 8px' },
  metaText:     { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' },

  btnPrimary:   { display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '8px 16px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  statusBadge:  { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, flexShrink: 0 },
  statusGreen:  { background: '#d1fae5', color: '#065f46' },
  statusAmber:  { background: '#fef3c7', color: '#92400e' },

  progressBg:   { height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  progressBar:  { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },
}
