// src/app/pages/doctor/ProjectWorkspacePage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Brain, CheckCircle2, Sparkles, UserCheck, Loader } from 'lucide-react'
import api from '../../../api/axiosInstance'

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkspaceTab = 'overview' | 'suggestions' | 'team' | 'supervisor'

interface Project {
    id:             number
    name:           string
    description:    string | null
    dueDate:        string | null
    maxTeamSize:    number | null
    requiredSkills: string[]
    formationMode:  'students' | 'doctor'
}

interface SuggestedStudent {
    id:         string
    name:       string
    matchScore: number
    skills:     string[]
    status:     'pending' | 'invited' | 'accepted'
}

interface TeamMember {
    id:     string
    name:   string
    skills: string[]
    status: 'invited' | 'accepted'
}

interface Supervisor {
    id:         string
    name:       string
    expertise:  string[]
    matchScore: number
    status:     'suggested' | 'requested' | 'confirmed'
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProjectWorkspacePage() {
    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()

    const [tab, setTab] = useState<WorkspaceTab>('overview')

    const [project, setProject]     = useState<Project | null>(null)
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState<string | null>(null)

    // AI workspace state — wire to API endpoints when ready
    const [suggestions] = useState<SuggestedStudent[]>([])
    const [teamMembers] = useState<TeamMember[]>([])
    const [supervisor]  = useState<Supervisor | null>(null)

    useEffect(() => {
        if (!projectId) return
        setLoading(true)
        setError(null)
        api.get(`/doctor/projects/${projectId}`)
            .then(res => setProject(res.data))
            .catch(() => setError('Failed to load project.'))
            .finally(() => setLoading(false))
    }, [projectId])

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={S.page}>
                <div style={S.centered}>
                    <Loader size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>Loading project...</p>
                </div>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
        )
    }

    // ── Error / Not Found ─────────────────────────────────────────────────────
    if (error || !project) {
        return (
            <div style={S.page}>
                <div style={S.centered}>
                    <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>{error ?? 'Project not found.'}</p>
                    <button style={S.backBtn} onClick={() => navigate('/doctor-dashboard')}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const fmt = (d: string | null) => d
        ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null

    const workspaceTabs: { id: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview',    label: 'Overview',       icon: <Brain size={13} /> },
        { id: 'suggestions', label: 'AI Suggestions', icon: <Sparkles size={13} /> },
        { id: 'team',        label: 'Team',           icon: <Users size={13} /> },
        { id: 'supervisor',  label: 'Supervisor',     icon: <UserCheck size={13} /> },
    ]

    return (
        <div style={S.page}>
            <BgDecor />

            {/* NAV */}
            <nav style={S.nav}>
                <div style={S.navInner}>
                    <button style={S.backBtn} onClick={() => navigate('/doctor-dashboard')}>
                        <ArrowLeft size={15} /> Supervisor Dashboard
                    </button>
                    <div style={{ flex: 1 }} />
                    <span style={S.workspaceBadge}>AI Workspace</span>
                </div>
            </nav>

            <div style={S.content}>

                {/* Project Header */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <div style={S.accentDot} />
                        <div>
                            <h1 style={S.title}>{project.name}</h1>
                            <div style={S.metaRow}>
                                {project.maxTeamSize && (
                                    <span style={S.metaItem}><Users size={13} /> Up to {project.maxTeamSize} students</span>
                                )}
                                {project.dueDate && (
                                    <>
                                        <span style={S.metaDot}>·</span>
                                        <span style={S.metaItem}>📅 Due {fmt(project.dueDate)}</span>
                                    </>
                                )}
                                {project.requiredSkills.length > 0 && (
                                    <>
                                        <span style={S.metaDot}>·</span>
                                        <span style={S.metaItem}>
                                            {project.requiredSkills.slice(0, 3).join(', ')}
                                            {project.requiredSkills.length > 3 ? ` +${project.requiredSkills.length - 3}` : ''}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={S.statsRow}>
                        <StatPill icon={<Sparkles size={12} color="#6366f1" />} value={suggestions.length}                                          label="AI Matches" color="#6366f1" />
                        <StatPill icon={<Users size={12} color="#10b981" />}    value={teamMembers.filter(m => m.status === 'accepted').length}      label="Accepted"   color="#10b981" />
                        <StatPill icon={<CheckCircle2 size={12} color={supervisor ? '#10b981' : '#94a3b8'} />} value={supervisor ? 1 : 0}            label="Supervisor" color={supervisor ? '#10b981' : '#94a3b8'} />
                    </div>
                </div>

                {/* Tabs */}
                <div style={S.tabsBar}>
                    {workspaceTabs.map(t => (
                        <button key={t.id} style={{ ...S.tabBtn, ...(tab === t.id ? S.tabBtnActive : {}) }} onClick={() => setTab(t.id)}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* ── OVERVIEW ─────────────────────────────────────────────── */}
                {tab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <InfoSection title="Project Description">
                            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                                {project.description ?? <span style={{ color: '#94a3b8' }}>No description provided.</span>}
                            </p>
                        </InfoSection>

                        <InfoSection title="Required Skills">
                            {project.requiredSkills.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {project.requiredSkills.map(sk => (
                                        <span key={sk} style={S.skillChip}>{sk}</span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No required skills specified.</p>
                            )}
                        </InfoSection>

                        <InfoSection title="Team Configuration">
                            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                                <div>
                                    <span style={S.infoLabel}>Max Team Size</span>
                                    <p style={S.infoValue}>{project.maxTeamSize ?? '—'} students</p>
                                </div>
                                <div>
                                    <span style={S.infoLabel}>Formation Mode</span>
                                    <p style={S.infoValue}>{project.formationMode === 'doctor' ? 'AI / Supervisor' : 'Student Choice'}</p>
                                </div>
                                {project.dueDate && (
                                    <div>
                                        <span style={S.infoLabel}>Due Date</span>
                                        <p style={S.infoValue}>{fmt(project.dueDate)}</p>
                                    </div>
                                )}
                            </div>
                        </InfoSection>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button style={S.primaryBtn} onClick={() => setTab('suggestions')}>
                                <Sparkles size={13} /> View AI Suggestions
                            </button>
                            <button style={S.ghostBtn} onClick={() => setTab('team')}>
                                <Users size={13} /> Manage Team
                            </button>
                        </div>
                    </div>
                )}

                {/* ── AI SUGGESTIONS ───────────────────────────────────────── */}
                {tab === 'suggestions' && (
                    <div>
                        <div style={S.sectionHeader}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Sparkles size={15} color="#6366f1" />
                                    <h2 style={S.sectionTitle}>AI-Suggested Students</h2>
                                    <span style={S.sectionCount}>{suggestions.length}</span>
                                </div>
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                                    Matched based on required skills and availability
                                </p>
                            </div>
                        </div>

                        {suggestions.length === 0 ? (
                            <div style={S.empty}>
                                <Brain size={28} color="#c7d2fe" />
                                <p style={{ color: '#94a3b8', margin: '10px 0 4px', fontSize: 13, fontWeight: 600 }}>AI suggestions will appear here</p>
                                <p style={{ color: '#cbd5e1', margin: 0, fontSize: 12 }}>
                                    The system will analyze registered students and suggest the best matches for this project.
                                </p>
                            </div>
                        ) : (
                            <div style={S.cardList}>
                                {suggestions.map(s => (
                                    <div key={s.id} style={S.suggestionCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <div style={S.avatar}>{initials(s.name)}</div>
                                            <div style={{ flex: 1 }}>
                                                <p style={S.memberName}>{s.name}</p>
                                                <div style={S.skillRow}>
                                                    {s.skills.map(sk => <span key={sk} style={S.skillChip}>{sk}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                            <MatchBadge score={s.matchScore} />
                                            {s.status === 'pending'  && <button style={S.primaryBtn}>Invite</button>}
                                            {s.status === 'invited'  && <span style={S.tagAmber}>Invited</span>}
                                            {s.status === 'accepted' && <span style={S.tagGreen}>Accepted</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TEAM ─────────────────────────────────────────────────── */}
                {tab === 'team' && (
                    <div>
                        <div style={S.sectionHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={15} color="#10b981" />
                                <h2 style={S.sectionTitle}>Team Formation</h2>
                                <span style={{ ...S.sectionCount, background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                                    {teamMembers.length}
                                </span>
                            </div>
                            <button style={S.primaryBtn} onClick={() => setTab('suggestions')}>
                                <Sparkles size={13} /> Add from AI Suggestions
                            </button>
                        </div>

                        {teamMembers.length === 0 ? (
                            <div style={S.empty}>
                                <Users size={28} color="#c7d2fe" />
                                <p style={{ color: '#94a3b8', margin: '10px 0 4px', fontSize: 13, fontWeight: 600 }}>No team members yet</p>
                                <p style={{ color: '#cbd5e1', margin: '0 0 14px', fontSize: 12 }}>
                                    Invite students from AI suggestions or send a direct invitation.
                                </p>
                                <button style={S.primaryBtn} onClick={() => setTab('suggestions')}>
                                    <Sparkles size={13} /> View AI Suggestions
                                </button>
                            </div>
                        ) : (
                            <div style={S.cardList}>
                                {teamMembers.map(m => (
                                    <div key={m.id} style={S.suggestionCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <div style={S.avatar}>{initials(m.name)}</div>
                                            <div style={{ flex: 1 }}>
                                                <p style={S.memberName}>{m.name}</p>
                                                <div style={S.skillRow}>
                                                    {m.skills.map(sk => <span key={sk} style={S.skillChip}>{sk}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={m.status === 'accepted' ? S.tagGreen : S.tagAmber}>
                                            {m.status === 'accepted' ? 'Accepted' : 'Invited'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── SUPERVISOR ───────────────────────────────────────────── */}
                {tab === 'supervisor' && (
                    <div>
                        <div style={S.sectionHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserCheck size={15} color="#6366f1" />
                                <h2 style={S.sectionTitle}>Supervisor</h2>
                            </div>
                        </div>

                        {!supervisor ? (
                            <div style={S.empty}>
                                <UserCheck size={28} color="#c7d2fe" />
                                <p style={{ color: '#94a3b8', margin: '10px 0 4px', fontSize: 13, fontWeight: 600 }}>No supervisor assigned yet</p>
                                <p style={{ color: '#cbd5e1', margin: '0 0 14px', fontSize: 12 }}>
                                    The AI will suggest the most suitable supervisor based on this project's topic and required expertise.
                                </p>
                                <button style={S.primaryBtn}>
                                    <Brain size={13} /> Request AI Suggestion
                                </button>
                            </div>
                        ) : (
                            <div style={S.suggestionCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <div style={{ ...S.avatar, width: 44, height: 44, fontSize: 14 }}>
                                        {initials(supervisor.name)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={S.memberName}>{supervisor.name}</p>
                                        <div style={S.skillRow}>
                                            {supervisor.expertise.map(e => <span key={e} style={S.skillChip}>{e}</span>)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                    <MatchBadge score={supervisor.matchScore} />
                                    {supervisor.status === 'suggested'  && <button style={S.primaryBtn}>Send Request</button>}
                                    {supervisor.status === 'requested'  && <span style={S.tagAmber}>Pending</span>}
                                    {supervisor.status === 'confirmed'  && <span style={S.tagGreen}>Confirmed</span>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

            <style>{`a{text-decoration:none;} button:active{transform:scale(.98);} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 12px' }}>
                {title}
            </h3>
            {children}
        </div>
    )
}

function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {icon}
                <span style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'Syne, sans-serif' }}>{value}</span>
            </div>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
        </div>
    )
}

function MatchBadge({ score }: { score: number }) {
    const color = score >= 90 ? '#10b981' : score >= 75 ? '#6366f1' : '#f59e0b'
    return (
        <div style={{ padding: '6px 12px', background: '#f8fafc', border: `1.5px solid ${color}33`, borderRadius: 10, textAlign: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'Syne, sans-serif', display: 'block', lineHeight: 1 }}>{score}%</span>
            <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>AI Match</span>
        </div>
    )
}

function BgDecor() {
    return (
        <>
            <div style={{ position: 'fixed', top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
    page:          { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
    centered:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
    nav:           { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
    navInner:      { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 12 },
    backBtn:       { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' },
    workspaceBadge:{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, background: '#eef2ff', color: '#6366f1' },
    content:       { maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },

    header:        { background: 'white', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 18, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const, boxShadow: '0 4px 20px rgba(99,102,241,0.06)' },
    headerLeft:    { display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 },
    accentDot:     { width: 4, height: 48, borderRadius: 4, flexShrink: 0, marginTop: 2, background: 'linear-gradient(180deg,#6366f1,#a855f7)' },
    title:         { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.4px', fontFamily: 'Syne, sans-serif' },
    metaRow:       { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
    metaItem:      { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#64748b' },
    metaDot:       { color: '#cbd5e1' },
    statsRow:      { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignSelf: 'center' },

    tabsBar:       { display: 'flex', gap: 2, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' },
    tabBtn:        { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' },
    tabBtnActive:  { background: '#eef2ff', color: '#6366f1', fontWeight: 700 },

    sectionHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' as const },
    sectionTitle:  { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
    sectionCount:  { fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, padding: '2px 8px' },

    cardList:      { display: 'flex', flexDirection: 'column' as const, gap: 12 },
    suggestionCard:{ display: 'flex', alignItems: 'center', gap: 16, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(99,102,241,0.04)', flexWrap: 'wrap' as const },
    avatar:        { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    memberName:    { fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
    skillRow:      { display: 'flex', flexWrap: 'wrap' as const, gap: 4 },
    skillChip:     { padding: '3px 9px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },
    tagGreen:      { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#d1fae5', color: '#065f46' },
    tagAmber:      { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#fef3c7', color: '#92400e' },

    infoLabel:     { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '.06em' },
    infoValue:     { fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' },

    empty:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', background: 'white', border: '1.5px dashed #c7d2fe', borderRadius: 14, textAlign: 'center' as const },
    primaryBtn:    { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    ghostBtn:      { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
}
