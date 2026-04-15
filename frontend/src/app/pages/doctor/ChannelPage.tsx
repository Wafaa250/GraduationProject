// src/app/pages/doctor/ChannelPage.tsx
import { useState, type CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Users, Layers, FolderOpen, Plus } from 'lucide-react'

type ChannelTab = 'overview' | 'students' | 'projects' | 'settings'

// ── Project types (ready to be filled from API) ──────────────────────────────
interface Project {
    id:          string
    name:        string
    description: string | null
    /** Prefer for display: `abstract ?? description` */
    abstract?:   string | null
    publishDate: string | null   // ISO date string
    dueDate:     string | null   // ISO date string
    weight:      number | null   // % of final grade
    maxTeamSize: number | null
    teamCount:   number
    mode:        'students' | 'doctor'
    skills:      string[]
}

// ── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
    const modeLabel  = project.mode === 'doctor' ? 'AI / Doctor' : 'Students choose'
    const modeColor  = project.mode === 'doctor' ? '#6366f1' : '#10b981'
    const modeBg     = project.mode === 'doctor' ? '#eef2ff' : '#f0fdf4'
    const modeBorder = project.mode === 'doctor' ? '#c7d2fe' : '#bbf7d0'

    const fmt = (d: string | null) => d
        ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null

    const bodyText = (project.abstract ?? project.description ?? '').trim()

    return (
        <div style={PC.card}>
            <div style={PC.accentBar} />

            {/* Mode badge */}
            <div style={PC.header}>
                <span style={{ ...PC.modeBadge, background: modeBg, color: modeColor, border: `1px solid ${modeBorder}` }}>
                    {modeLabel}
                </span>
                {project.weight != null && (
                    <span style={PC.weightBadge}>{project.weight}%</span>
                )}
            </div>

            {/* Name */}
            <h3 style={PC.name}>{project.name}</h3>

            {/* Abstract / description (channel projects typically use description) */}
            {bodyText ? (
                <p style={PC.desc}>{bodyText}</p>
            ) : null}

            {/* Meta row */}
            <div style={PC.meta}>
                {fmt(project.dueDate) && (
                    <div style={PC.metaItem}>
                        <span style={PC.metaIcon}>📅</span>
                        <span style={PC.metaText}>Due {fmt(project.dueDate)}</span>
                    </div>
                )}
                {project.maxTeamSize != null && (
                    <div style={PC.metaItem}>
                        <Users size={13} color="#94a3b8" />
                        <span style={PC.metaText}>Max {project.maxTeamSize} students</span>
                    </div>
                )}
                <div style={PC.metaItem}>
                    <Users size={13} color="#94a3b8" />
                    <span style={PC.metaText}>{project.teamCount} Teams</span>
                </div>
            </div>

            {/* Skills */}
            {project.skills.length > 0 && (
                <div style={PC.skills}>
                    {project.skills.slice(0, 4).map(sk => (
                        <span key={sk} style={PC.skillChip}>{sk}</span>
                    ))}
                    {project.skills.length > 4 && (
                        <span style={PC.skillMore}>+{project.skills.length - 4}</span>
                    )}
                </div>
            )}

            <button style={PC.viewBtn}>View Project</button>
        </div>
    )
}

const PC: Record<string, CSSProperties> = {
    card:        { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 20px 18px', boxShadow: '0 2px 12px rgba(99,102,241,0.04)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10 },
    accentBar:   { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0', background: 'linear-gradient(90deg,#6366f1,#a855f7)' },
    header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modeBadge:   { fontSize: 10, fontWeight: 700, letterSpacing: '.04em', padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase' as const },
    weightBadge: { fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20, padding: '2px 8px' },
    name:        { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' },
    desc:        { fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
    meta:        { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const },
    metaItem:    { display: 'flex', alignItems: 'center', gap: 4 },
    metaIcon:    { fontSize: 13 },
    metaText:    { fontSize: 12, color: '#64748b', fontWeight: 500 },
    skills:      { display: 'flex', flexWrap: 'wrap' as const, gap: 5 },
    skillChip:   { padding: '3px 9px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },
    skillMore:   { padding: '3px 9px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 11, color: '#94a3b8', fontWeight: 600 },
    viewBtn:     { marginTop: 4, padding: '8px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
}

interface Props {
    channels: CourseChannel[]
}

export default function ChannelPage({ channels }: Props) {
    const { channelId } = useParams<{ channelId: string }>()
    const navigate = useNavigate()
    const [tab, setTab] = useState<ChannelTab>('overview')
    const [copied, setCopied] = useState(false)
    const [showCreateProject, setShowCreateProject] = useState(false)
    const [teamMode, setTeamMode] = useState<'students' | 'doctor'>('students')
    const [skillInput, setSkillInput] = useState('')
    const [skills, setSkills] = useState<string[]>([])
    const [selectedSize, setSelectedSize] = useState<number | null>(null)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    // Modal controlled fields
    const [projectName, setProjectName]         = useState('')
    const [projectDesc, setProjectDesc]         = useState('')
    const [publishDate, setPublishDate]         = useState('')
    const [dueDate, setDueDate]                 = useState('')
    const [projectWeight, setProjectWeight]     = useState('')
    // Projects list — will be populated from API later
    const [projects, setProjects] = useState<Project[]>([])

    const resetModal = () => {
        setProjectName('')
        setProjectDesc('')
        setTeamMode('students')
        setPublishDate('')
        setDueDate('')
        setProjectWeight('')
        setSelectedSize(null)
        setSkills([])
        setSkillInput('')
        setUploadedFile(null)
    }

    const handleCreateProject = () => {
        if (!projectName.trim()) return          // name is required

        // ── Data ready to send to API later ──────────────────────────────
        const projectData = {
            name:          projectName.trim(),
            description:   projectDesc.trim() || null,
            formationMode: teamMode,
            publishDate:   publishDate || null,
            dueDate:       dueDate     || null,
            weight:        projectWeight ? Number(projectWeight) : null,
            maxTeamSize:   selectedSize,
            skills,
            file:          uploadedFile,
        }
        console.log('[ChannelPage] project payload →', projectData)
        // TODO: await api.post(`/doctor/channels/${channelId}/projects`, projectData)

        resetModal()
        setShowCreateProject(false)
    }

    const channel = channels.find(c => c.id === channelId)

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
        { id: 'overview',  label: 'Overview' },
        { id: 'students',  label: 'Students' },
        { id: 'projects',  label: 'Projects' },
        { id: 'settings',  label: 'Settings' },
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

                            </div>
                        </div>
                    </div>

                    <div style={S.actions}>
                        <div style={S.inviteBox}>
                          
                        </div>
                    
                      
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
                            {t.id === 'projects' && (
                                <span style={{ ...S.tabCount, ...(tab === t.id ? S.tabCountActive : {}) }}>
                                    0
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

                          <div style={S.sectionHeader}>
</div>
                        
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

                    {/* PROJECTS */}
                    {tab === 'projects' && (
                        <div>
                            <div style={S.sectionHeader}>
                                <h2 style={S.sectionTitle}>Projects</h2>
                                {projects.length > 0 && (
                                    <button style={S.primaryBtn} onClick={() => setShowCreateProject(true)}>
                                        <Plus size={13} /> Create Project
                                    </button>
                                )}
                            </div>

                            {projects.length === 0 ? (
                                <div style={S.empty}>
                                    <FolderOpen size={28} color="#c7d2fe" />
                                    <p style={{ color: '#94a3b8', margin: '10px 0 14px', fontSize: 13 }}>
                                        No projects yet
                                    </p>
                                    <button style={S.primaryBtn} onClick={() => setShowCreateProject(true)}>
                                        <Plus size={13} /> Create Project
                                    </button>
                                </div>
                            ) : (
                                // projects will be rendered here later from API
                                <div style={S.projectsGrid}>
                                    {projects.map(p => (
                                        <ProjectCard key={p.id} project={p} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


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

            {/* CREATE PROJECT MODAL */}
            {showCreateProject && (
                <div style={S.modalOverlay} onClick={() => setShowCreateProject(false)}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={S.modalHeader}>
                            <div>
                                <h2 style={S.modalTitle}>Create Project</h2>
                                <p style={S.modalSub}>Add a new project to this channel</p>
                            </div>
                            <button style={S.modalCloseBtn} onClick={() => setShowCreateProject(false)}>✕</button>
                        </div>

                        {/* Fields */}
                        <div style={S.modalBody}>

                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Project Name</label>
                                <input
                                    style={S.fieldInput}
                                    type="text"
                                    placeholder="e.g. Smart Attendance System"
                                    value={projectName}
                                    onChange={e => setProjectName(e.target.value)}
                                />
                            </div>

                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    style={S.fieldTextarea}
                                    placeholder="Brief description of the project..."
                                    rows={3}
                                    value={projectDesc}
                                    onChange={e => setProjectDesc(e.target.value)}
                                />
                            </div>

                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Team Formation Mode</label>
                                <div style={S.radioGroup}>
                                    <label style={S.radioOption}>
                                        <input
                                            type="radio"
                                            name="teamMode"
                                            value="students"
                                            checked={teamMode === 'students'}
                                            onChange={() => setTeamMode('students')}
                                            style={{ accentColor: '#6366f1' }}
                                        />
                                        <div>
                                            <span style={S.radioLabel}>Students choose teams</span>
                                            <span style={S.radioHint}>Students form their own groups freely</span>
                                        </div>
                                    </label>
                                    <label style={S.radioOption}>
                                        <input
                                            type="radio"
                                            name="teamMode"
                                            value="doctor"
                                            checked={teamMode === 'doctor'}
                                            onChange={() => setTeamMode('doctor')}
                                            style={{ accentColor: '#6366f1' }}
                                        />
                                        <div>
                                            <span style={S.radioLabel}>Doctor / AI generate teams</span>
                                            <span style={S.radioHint}>Teams are suggested based on skills</span>
                                        </div>
                                    </label>
                            </div>
                        </div>

                            {/* Dates row */}
                            <div style={S.formRow}>
                                <div style={S.fieldGroup}>
                                    <label style={S.fieldLabel}>Publish Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                    <input style={S.fieldInput} type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.fieldLabel}>Due Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                    <input style={S.fieldInput} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                </div>
                            </div>

                            {/* Weight */}
                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Project Weight <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                <div style={S.weightRow}>
                                    <input
                                        style={{ ...S.fieldInput, width: 90 }}
                                        type="number"
                                        min={0}
                                        max={100}
                                        placeholder="e.g. 30"
                                        value={projectWeight}
                                        onChange={e => setProjectWeight(e.target.value)}
                                    />
                                    <span style={S.weightUnit}>% of final grade</span>
                                </div>
                            </div>

                            {/* Max Team Size */}
                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Max Team Size</label>
                                <div style={S.teamSizeRow}>
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            style={{
                                                ...S.sizeChip,
                                                ...(selectedSize === n ? S.sizeChipActive : {}),
                                            }}
                                            onClick={() => setSelectedSize(n)}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                    <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center' }}>students</span>
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Required Skills <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                <div style={S.skillInputRow}>
                                    <input
                                        style={{ ...S.fieldInput, flex: 1 }}
                                        type="text"
                                        placeholder="e.g. React, Node.js, AI..."
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => {
                                            if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                                                e.preventDefault()
                                                setSkills(prev => [...prev, skillInput.trim()])
                                                setSkillInput('')
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        style={S.skillAddBtn}
                                        onClick={() => {
                                            if (skillInput.trim()) {
                                                setSkills(prev => [...prev, skillInput.trim()])
                                                setSkillInput('')
                                            }
                                        }}
                                    >Add</button>
                                </div>
                                {skills.length > 0 && (
                                    <div style={S.skillTags}>
                                        {skills.map((sk, i) => (
                                            <span key={i} style={S.skillTag}>
                                                {sk}
                                                <button
                                                    type="button"
                                                    style={S.skillRemove}
                                                    onClick={() => setSkills(prev => prev.filter((_, j) => j !== i))}
                                                >✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* File Upload */}
                            <div style={S.fieldGroup}>
                                <label style={S.fieldLabel}>Attach File <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                <label style={{ ...S.uploadBox, ...(uploadedFile ? S.uploadBoxDone : {}) }}>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.zip,image/*"
                                        style={{ display: 'none' }}
                                        onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}
                                    />
                                    {uploadedFile ? (
                                        <>
                                            <span style={S.uploadIcon}>✅</span>
                                            <span style={{ ...S.uploadText, color: '#10b981' }}>{uploadedFile.name}</span>
                                            <span style={S.uploadHint}>Click to change file</span>
                                        </>
                                    ) : (
                                        <>
                                            <span style={S.uploadIcon}>📎</span>
                                            <span style={S.uploadText}>Choose file or drag here</span>
                                            <span style={S.uploadHint}>PDF, Word, ZIP, Image</span>
                                        </>
                                    )}
                                </label>
                            </div>

                        </div>

                        {/* Actions */}
                        <div style={S.modalFooter}>
                            <button style={S.cancelBtn} onClick={() => { resetModal(); setShowCreateProject(false) }}>
                                Cancel
                            </button>
                            <button
                                style={{ ...S.primaryBtn, opacity: projectName.trim() ? 1 : 0.5, cursor: projectName.trim() ? 'pointer' : 'not-allowed' }}
                                disabled={!projectName.trim()}
                                onClick={handleCreateProject}
                            >
                                <Plus size={13} /> Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`a{text-decoration:none;} button:hover:not(:disabled){opacity:.88;} button:active{transform:scale(.98);} input::placeholder,textarea::placeholder{color:#94a3b8;} input:focus,textarea:focus{outline:none;border-color:#6366f1!important;} textarea{resize:vertical;}`}</style>
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

const S: Record<string, CSSProperties> = {
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

    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 16 },
    modal:        { background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,.15)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' as const, fontFamily: 'DM Sans, sans-serif' },
    modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 0' },
    modalTitle:   { fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 3px', fontFamily: 'Syne, sans-serif' },
    modalSub:     { fontSize: 12, color: '#94a3b8', margin: 0 },
    modalCloseBtn:{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
    modalBody:    { padding: '20px 24px', display: 'flex', flexDirection: 'column' as const, gap: 16 },
    modalFooter:  { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 24px 22px' },

    fieldGroup:   { display: 'flex', flexDirection: 'column' as const, gap: 6 },
    fieldLabel:   { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.06em' },
    fieldInput:   { padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit' },
    fieldTextarea:{ padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', fontFamily: 'inherit', lineHeight: 1.5 },

    radioGroup:   { display: 'flex', flexDirection: 'column' as const, gap: 8 },
    radioOption:  { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer' },
    radioLabel:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a' },
    radioHint:    { display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 2 },

    cancelBtn:    { padding: '9px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

    formRow:      { display: 'flex', gap: 12 },
    weightRow:    { display: 'flex', alignItems: 'center', gap: 10 },
    weightUnit:   { fontSize: 13, color: '#64748b', fontWeight: 500 },

    teamSizeRow:  { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
    sizeChip:     { padding: '6px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' },
    sizeChipActive: { background: '#eef2ff', border: '1.5px solid #6366f1', color: '#6366f1' },

    skillInputRow:{ display: 'flex', gap: 8 },
    skillAddBtn:  { padding: '9px 14px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#6366f1', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
    skillTags:    { display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 6 },
    skillTag:     { display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#6366f1' },
    skillRemove:  { background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: 10, padding: 0, lineHeight: 1, fontFamily: 'inherit' },

    uploadBox:    { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4, padding: '18px', background: '#f8fafc', border: '1.5px dashed #c7d2fe', borderRadius: 10, cursor: 'pointer', textAlign: 'center' as const },
    uploadBoxDone:{ background: '#f0fdf4', border: '1.5px dashed #86efac' },
    uploadIcon:   { fontSize: 20 },
    uploadText:   { fontSize: 13, fontWeight: 600, color: '#64748b' },
    uploadHint:   { fontSize: 11, color: '#94a3b8' },

    projectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
}