// src/app/pages/doctor/ChannelPage.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Users, Layers, Plus, Settings } from 'lucide-react'
import { CourseChannel } from './data/doctorMockData'

type ChannelTab = 'overview' | 'students' | 'teams' | 'settings'

interface Props {
    channels: CourseChannel[]
}

export default function ChannelPage({ channels }: Props) {
    const { channelId } = useParams<{ channelId: string }>()
    const navigate = useNavigate()
    const [tab, setTab] = useState<ChannelTab>('overview')
    const [copied, setCopied] = useState(false)

    const channel = channels.find(c => c.id === channelId)

    // ── Channel not found ──
    if (!channel) {
        return (
            <div style={S.page}>
                <div style={S.notFound}>
                    <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 16 }}>Channel not found.</p>
                    <button style={S.backBtn} onClick={() => navigate('/doctor-dashboard')}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(channel.inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const tabs: { id: ChannelTab; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'students', label: 'Students' },
        { id: 'teams', label: 'Teams' },
        { id: 'settings', label: 'Settings' },
    ]

    return (
        <div style={S.page}>
            <BgDecor />

            {/* NAV */}
            <nav style={S.nav}>
                <div style={S.navInner}>
                    <button style={S.backBtn} onClick={() => navigate('/doctor-dashboard')}>
                        <ArrowLeft size={15} /> Doctor Dashboard
                    </button>
                    <div style={{ flex: 1 }} />
                    <div style={{ ...S.badge, background: channel.color + '18', color: channel.color }}>
                        {channel.courseCode}
                    </div>
                </div>
            </nav>

            <div style={S.content}>

                {/* ── Channel Header ── */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <div style={{ ...S.accentDot, background: channel.color }} />
                        <div>
                            <h1 style={S.title}>{channel.name} — {channel.section}</h1>
                            <div style={S.metaRow}>
                                <span style={S.metaItem}>Course Code: <strong>{channel.courseCode}</strong></span>
                                <span style={S.metaDot}>·</span>
                                <span style={S.metaItem}><Users size={13} /> {channel.studentsCount} Students</span>
                                <span style={S.metaDot}>·</span>
                                <span style={S.metaItem}><Layers size={13} /> {channel.teams.length} Teams</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={S.actions}>
                        <div style={S.inviteBox}>
                            <span style={S.inviteLabel}>Invite Code</span>
                            <div style={S.codeRow}>
                                <code style={S.code}>{channel.inviteCode}</code>
                                <button style={S.copyBtn} onClick={handleCopy}>
                                    {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <button style={S.primaryBtn}>
                            <Plus size={14} /> Create Team
                        </button>
                        <button style={S.ghostBtn}>
                            <Users size={14} /> Manage Students
                        </button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div style={S.tabsBar}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            style={{ ...S.tabBtn, ...(tab === t.id ? S.tabBtnActive : {}) }}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                            {t.id === 'students' && (
                                <span style={{ ...S.tabCount, ...(tab === t.id ? S.tabCountActive : {}) }}>
                                    {channel.studentsCount}
                                </span>
                            )}
                            {t.id === 'teams' && (
                                <span style={{ ...S.tabCount, ...(tab === t.id ? S.tabCountActive : {}) }}>
                                    {channel.teams.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div style={S.tabContent}>

                    {/* OVERVIEW */}
                    {tab === 'overview' && (
                        <div>

                            {/* Channel Info Panel */}
                            <div style={S.infoPanel}>
                                <div style={S.infoPanelLeft}>
                                    <div style={S.infoRow}>
                                        <div style={S.infoItem}>
                                            <span style={S.infoLabel}>Course Name</span>
                                            <span style={S.infoValue}>{channel.name}</span>
                                        </div>
                                        <div style={S.infoItem}>
                                            <span style={S.infoLabel}>Course Code</span>
                                            <span style={{ ...S.infoValue, fontFamily: 'monospace', color: channel.color }}>{channel.courseCode}</span>
                                        </div>
                                        <div style={S.infoItem}>
                                            <span style={S.infoLabel}>Section</span>
                                            <span style={S.infoValue}>{channel.section}</span>
                                        </div>
                                        <div style={S.infoItem}>
                                            <span style={S.infoLabel}>Students</span>
                                            <span style={S.infoValue}>{channel.studentsCount}</span>
                                        </div>
                                        <div style={S.infoItem}>
                                            <span style={S.infoLabel}>Teams</span>
                                            <span style={S.infoValue}>{channel.teams.length}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={S.infoDivider} />
                                <div style={S.infoPanelRight}>
                                    <span style={S.infoLabel}>Invite Code</span>
                                    <div style={S.inviteCodeBox}>
                                        <code style={S.inviteCodeText}>{channel.inviteCode}</code>
                                        <button style={S.inviteCopyBtn} onClick={handleCopy}>
                                            {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                            {copied ? 'Copied!' : 'Copy Code'}
                                        </button>
                                    </div>
                                    <p style={S.inviteHint}>Share this code with students to join the channel</p>
                                </div>
                            </div>

                            <div style={S.statsRow}>
                                <div style={S.statCard}>
                                    <Users size={20} color="#6366f1" />
                                    <span style={S.statValue}>{channel.studentsCount}</span>
                                    <span style={S.statLabel}>Students</span>
                                </div>
                                <div style={S.statCard}>
                                    <Layers size={20} color="#10b981" />
                                    <span style={S.statValue}>{channel.teams.length}</span>
                                    <span style={S.statLabel}>Teams</span>
                                </div>
                                <div style={S.statCard}>
                                    <Users size={20} color="#f59e0b" />
                                    <span style={S.statValue}>
                                        {channel.teams.reduce((a, t) => a + t.members.length, 0)}
                                    </span>
                                    <span style={S.statLabel}>In Teams</span>
                                </div>
                                <div style={S.statCard}>
                                    <Users size={20} color="#94a3b8" />
                                    <span style={S.statValue}>
                                        {channel.studentsCount - channel.teams.reduce((a, t) => a + t.members.length, 0)}
                                    </span>
                                    <span style={S.statLabel}>No Team</span>
                                </div>
                            </div>

                            {/* Recent Teams */}
                            <div style={S.sectionHeader}>
                                <h2 style={S.sectionTitle}>Recent Teams</h2>
                                <button style={S.primaryBtn}><Plus size={13} /> Create Team</button>
                            </div>
                            {channel.teams.length === 0 ? (
                                <div style={S.empty}>
                                    <Layers size={28} color="#c7d2fe" />
                                    <p style={{ color: '#94a3b8', margin: '10px 0 14px', fontSize: 13 }}>No teams yet</p>
                                    <button style={S.primaryBtn}><Plus size={13} /> Create First Team</button>
                                </div>
                            ) : (
                                <div style={S.teamsGrid}>
                                    {channel.teams.slice(0, 3).map(team => (
                                        <div key={team.id} style={S.teamCard}>
                                            <h3 style={S.teamName}>{team.name}</h3>
                                            <p style={S.teamProject}>{team.projectTitle}</p>
                                            <div style={S.membersRow}>
                                                {team.members.map(m => (
                                                    <div key={m.id} style={S.avatar} title={m.name}>{m.avatar}</div>
                                                ))}
                                                <span style={S.membersLabel}>{team.members.length} members</span>
                                            </div>
                                            <div style={S.skills}>
                                                {team.skills.map(sk => <span key={sk} style={S.skillChip}>{sk}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STUDENTS */}
                    {tab === 'students' && (
                        <div>
                            <div style={S.sectionHeader}>
                                <h2 style={S.sectionTitle}>Enrolled Students</h2>
                                <button style={S.ghostBtn}><Plus size={13} /> Invite Student</button>
                            </div>
                            {channel.students.length === 0 ? (
                                <div style={S.empty}>
                                    <Users size={28} color="#c7d2fe" />
                                    <p style={{ color: '#94a3b8', margin: '10px 0', fontSize: 13 }}>No students yet</p>
                                </div>
                            ) : (
                                <div style={S.tableWrap}>
                                    <div style={S.tableHeader}>
                                        <span>Student</span>
                                        <span>Student ID</span>
                                        <span>Email</span>
                                        <span>Status</span>
                                    </div>
                                    {channel.students.map(student => {
                                        const inTeam = channel.teams.some(t => t.members.find(m => m.id === student.id))
                                        return (
                                            <div key={student.id} style={S.tableRow}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={S.avatar}>{student.avatar}</div>
                                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{student.name}</span>
                                                </div>
                                                <span style={S.tableId}>{student.studentId}</span>
                                                <span style={{ fontSize: 12, color: '#64748b' }}>{student.email}</span>
                                                <span style={{ ...S.statusBadge, background: inTeam ? '#f0fdf4' : '#f8fafc', color: inTeam ? '#16a34a' : '#94a3b8', border: inTeam ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                                                    {inTeam ? 'In Team' : 'Available'}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TEAMS */}
                    {tab === 'teams' && (
                        <div>
                            <div style={S.sectionHeader}>
                                <h2 style={S.sectionTitle}>All Teams</h2>
                                <button style={S.primaryBtn}><Plus size={13} /> Create Team</button>
                            </div>
                            {channel.teams.length === 0 ? (
                                <div style={S.empty}>
                                    <Layers size={28} color="#c7d2fe" />
                                    <p style={{ color: '#94a3b8', margin: '10px 0 14px', fontSize: 13 }}>No teams yet</p>
                                    <button style={S.primaryBtn}><Plus size={13} /> Create First Team</button>
                                </div>
                            ) : (
                                <div style={S.teamsGrid}>
                                    {channel.teams.map(team => (
                                        <div key={team.id} style={S.teamCard}>
                                            <h3 style={S.teamName}>{team.name}</h3>
                                            <p style={S.teamProject}>{team.projectTitle}</p>
                                            <div style={S.membersRow}>
                                                {team.members.map(m => (
                                                    <div key={m.id} style={S.avatar} title={m.name}>{m.avatar}</div>
                                                ))}
                                                <span style={S.membersLabel}>{team.members.length} members</span>
                                            </div>
                                            <div style={S.skills}>
                                                {team.skills.map(sk => <span key={sk} style={S.skillChip}>{sk}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SETTINGS */}
                    {tab === 'settings' && (
                        <div style={S.settingsWrap}>
                            <h2 style={S.sectionTitle}>Channel Settings</h2>
                            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
                                Edit or delete this channel. Coming in next step.
                            </p>
                        </div>
                    )}

                </div>
            </div>

            <style>{`a{text-decoration:none;} button:hover:not(:disabled){opacity:.88;} button:active{transform:scale(.98);}`}</style>
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

const S: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
    nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
    navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 12 },
    backBtn: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' },
    badge: { fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '.04em', padding: '4px 10px', borderRadius: 7 },
    content: { maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },

    header: { background: 'white', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 18, padding: '22px 26px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const, boxShadow: '0 4px 20px rgba(99,102,241,0.06)' },
    headerLeft: { display: 'flex', alignItems: 'flex-start', gap: 14 },
    accentDot: { width: 4, height: 48, borderRadius: 4, flexShrink: 0, marginTop: 2 },
    title: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.4px', fontFamily: 'Syne, sans-serif' },
    metaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
    metaItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#64748b' },
    metaDot: { color: '#cbd5e1', fontSize: 14 },

    actions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
    inviteBox: { display: 'flex', flexDirection: 'column', gap: 4 },
    inviteLabel: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '.06em' },
    codeRow: { display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px' },
    code: { fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0f172a' },
    copyBtn: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },

    primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    ghostBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },

    tabsBar: { display: 'flex', gap: 2, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' },
    tabBtn: { padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 500, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 },
    tabBtnActive: { background: '#eef2ff', color: '#6366f1', fontWeight: 700 },
    tabCount: { fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#94a3b8', padding: '1px 7px', borderRadius: 20 },
    tabCountActive: { background: '#c7d2fe', color: '#6366f1' },
    tabContent: {},

    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 },
    statCard: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(99,102,241,0.04)' },
    statValue: { fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
    statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em' },

    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },

    teamsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 },
    teamCard: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 2px 8px rgba(99,102,241,0.04)' },
    teamName: { fontSize: 13, fontWeight: 700, color: '#6366f1', margin: 0 },
    teamProject: { fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 },
    membersRow: { display: 'flex', alignItems: 'center', gap: 4 },
    avatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0', cursor: 'default', flexShrink: 0 },
    membersLabel: { fontSize: 11, color: '#94a3b8', marginLeft: 4 },
    skills: { display: 'flex', flexWrap: 'wrap' as const, gap: 4 },
    skillChip: { padding: '3px 9px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },

    tableWrap: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' },
    tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr 1fr', padding: '10px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    tableRow: { display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr 1fr', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f1f5f9' },
    tableId: { fontFamily: 'monospace', fontSize: 12, color: '#64748b' },
    statusBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, width: 'fit-content' },

    settingsWrap: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(99,102,241,0.04)' },
    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', background: 'white', border: '1.5px dashed #c7d2fe', borderRadius: 14, textAlign: 'center' as const },
    notFound: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
    infoPanel: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '22px 26px', marginBottom: 20, display: 'flex', alignItems: 'stretch', gap: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.04)' },
    infoPanelLeft: { flex: 1 },
    infoRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 24 },
    infoItem: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 },
    infoLabel: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '.06em' },
    infoValue: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
    infoDivider: { width: 1, background: '#f1f5f9', margin: '0 26px', flexShrink: 0 },
    infoPanelRight: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 },
    inviteCodeBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' },
    inviteCodeText: { fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#0f172a', flex: 1, letterSpacing: '.04em' },
    inviteCopyBtn: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    inviteHint: { fontSize: 11, color: '#94a3b8', margin: 0 },
}