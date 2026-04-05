import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Bell, Search, Settings, ChevronRight, Users,
    BookOpen, CheckCircle2, Circle, Briefcase, MessageCircle,
    Activity, LogOut, UserPlus, Trophy, Sparkles, X
} from 'lucide-react'
import api from '../../../api/axiosInstance'
import { getDashboardSummary, SuggestedTeammate } from '../../../api/dashboardApi'
import { getReceivedInvitations } from '../../../api/invitationsApi'
import type { GradProject, GradProjectMember } from '../../../api/gradProjectApi'
import { removeProjectMember, changeProjectLeader } from '../../../api/gradProjectApi'
import {
    getRecommendedSupervisors,
    requestSupervisor,
    type Supervisor,
} from '../../../api/supervisorApi'

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

interface RecommendedProject {
    id: number
    title: string
    description: string | null
    lookingFor: string[]
    matchScore: number
    maxTeamSize: number | null
    dueDate: string | null
    formationMode: 'students' | 'doctor'
}

interface Application {
    id: number
    project: string
    status: string
}

interface Invitation {
    id: number
    project: string
    invitedBy: string
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState<'all' | 'projects' | 'teammates'>('all')
    const [user, setUser] = useState<StudentProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [teammates, setTeammates] = useState<SuggestedTeammate[]>([])
    const [notifOpen, setNotifOpen] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [recommendedProjects, setRecommendedProjects] = useState<RecommendedProject[]>([])
    const [applications, setApplications] = useState<Application[]>([])
    const [inviteLoading, setInviteLoading] = useState<number | null>(null)
    const [inviteMsg, setInviteMsg] = useState<{ id: number; msg: string; ok: boolean } | null>(null)

    // Toast for member-removal feedback — cleared automatically after 3 s
    const [removeMsg, setRemoveMsg] = useState<{ msg: string; ok: boolean } | null>(null)

    // Per-member loading state and toast for the Make Leader action
    const [promotingId, setPromotingId] = useState<number | null>(null)
    const [leaderMsg, setLeaderMsg] = useState<{ msg: string; ok: boolean } | null>(null)

    // ─── Modal States ─────────────────────────────────────────────────────────
    const [editInfoOpen, setEditInfoOpen] = useState(false)

    const [projectsModalOpen, setProjectsModalOpen] = useState(false)
    const [joinChannelOpen, setJoinChannelOpen] = useState(false)
    const [joinCode, setJoinCode] = useState('')

    // ── Graduation Project ────────────────────────────────────────────────────
    const [gradProject, setGradProject] = useState<GradProject | null>(null)
    const [gradLoading, setGradLoading] = useState(false)
    const [gradModalOpen, setGradModalOpen] = useState(false)
    const [gradForm, setGradForm] = useState({ name: '', description: '', skills: '', teamSize: '' })
    const [gradFormError, setGradFormError] = useState<string | null>(null)
    const [gradSubmitting, setGradSubmitting] = useState(false)
    const [gradTeammates, setGradTeammates] = useState<SuggestedTeammate[]>([])
    const [addTeammatesOpen, setAddTeammatesOpen] = useState(false)
    const [removingId, setRemovingId] = useState<number | null>(null)

    // Role the current user holds in their project — comes from GET /my envelope.
    // Kept separately from gradProject so it survives the same optimistic-update
    // pattern used for teamMembers / currentMembers / isFull.
const [myRole, setMyRole] = useState<'owner' | 'leader' | 'member' | null>(null)
    // Auth-layer userId from GET /me — stored in a ref so refetchGradProject can
    // read the latest value without needing it as a useCallback dependency.
    const myUserIdRef = React.useRef<number | null>(null)

    // StudentProfile.Id of the currently logged-in user — derived once
    // teamMembers are loaded by matching myUserIdRef against member.userId.
    // Used to suppress the Remove button on the current user's own row.
    const [myStudentId, setMyStudentId] = useState<number | null>(null)

    // ── Team members — owned separately so mutations don't require a full
    //    gradProject refetch. Initialized from gradProject on first load.
    //    Source of truth for the team members list UI.
    const [teamMembers, setTeamMembers] = useState<GradProjectMember[]>([])
    const [currentMembers, setCurrentMembers] = useState(0)
    const [isFull, setIsFull] = useState(false)

    const [showSupervisors, setShowSupervisors] = useState(false)
    const [supervisors, setSupervisors] = useState<Supervisor[]>([])
    const [loadingSup, setLoadingSup] = useState(false)
    const [requestingSupervisorId, setRequestingSupervisorId] = useState<number | null>(null)
    const [supervisorMsg, setSupervisorMsg] = useState<{ msg: string; ok: boolean } | null>(null)
    const [localSupervisor, setLocalSupervisor] = useState<{
        name: string
        specialization: string
    } | null>(null)

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    // ── Restore supervisor from localStorage on project load ──────────────────
    useEffect(() => {
        if (!gradProject) return

        const saved = localStorage.getItem(`project_supervisor_${gradProject.id}`)
        if (saved) {
            setLocalSupervisor(JSON.parse(saved))
        } else {
            setLocalSupervisor(null)
        }
    }, [gradProject])

    // ── fetchInvitations: reusable, callable manually or by effects ──────────
    // Extracted so it can be triggered on:
    //   1. Initial load (inside fetchData)
    //   2. Page focus / visibility change (window event)
    //   3. After accept/reject actions (handleInvite calls it)
    const fetchInvitations = useCallback(async () => {
        try {
            const received = await getReceivedInvitations()
            const pendingOnly = received
                .filter(i => i.status?.toLowerCase() === 'pending')
                .map(i => ({
                    id:        i.invitationId,
                    project:   i.projectName,
                    invitedBy: i.senderName,
                }))
            setInvitations(pendingOnly)
            setPendingCount(pendingOnly.length)
        } catch { /* non-critical */ }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Re-fetch invitations when the tab becomes visible again
    // (covers the case: user sends invite on StudentsPage → switches back)
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                fetchInvitations()
            }
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [fetchInvitations])

    // Auto-refresh invitations every 10 seconds
    useEffect(() => {
        const interval = setInterval(fetchInvitations, 10_000)
        return () => clearInterval(interval)
    }, [fetchInvitations])

    // Single call to GET /api/graduation-projects/my
    // Returns { role, project } — project is null when student has no affiliation
    const refetchGradProject = useCallback(async () => {
        try {
            setGradLoading(true)
            const res = await api.get('/graduation-projects/my')
            // res.data = { role: 'owner'|'member'|null, project: GradProject|null }
            const project: GradProject | null = res.data?.project ?? null
            const role: 'owner' | 'member' | null = res.data?.role ?? null
            setGradProject(project)
            setMyRole(role)

            // Seed the independent team-member state from the project payload.
            // The /my endpoint already embeds members via MapToDto, so no extra
            // fetch is needed on first load.
            if (project) {
                const members = project.members ?? []
                setTeamMembers(members)
                setCurrentMembers(project.currentMembers ?? 0)
                setIsFull(project.isFull ?? false)

                // Find the current user's own StudentProfile.Id by matching their
                // auth userId (captured from /me) against the member list.
                // This is used purely to hide the Remove button on their own row.
                const myRow = members.find(m => m.userId === myUserIdRef.current)
                setMyStudentId(myRow?.studentId ?? null)
            } else {
                setTeamMembers([])
                setCurrentMembers(0)
                setIsFull(false)
                setMyStudentId(null)
            }
        } catch (err: any) {
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                navigate('/login')
            }
            setGradProject(null)
            setMyRole(null)
            setTeamMembers([])
            setCurrentMembers(0)
            setIsFull(false)
            setMyStudentId(null)
        } finally {
            setGradLoading(false)
        }
    }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) { navigate('/login'); return }

                const profileRes = await api.get('/me')
                const data = profileRes.data
                myUserIdRef.current = data.id ?? null
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
                    setTeammates(dashData.suggestedTeammates?.length > 0 ? dashData.suggestedTeammates : [])
                } catch {
                    setTeammates([])
                }

                // Fetch graduation project — GET /api/graduation-projects/my
                await refetchGradProject()

                // Fetch invitations via shared helper
                await fetchInvitations()

            } catch {
                setUser({
                    name: localStorage.getItem('name') ?? (undefined as any),
                    email: localStorage.getItem('email') ?? '',
                    role: localStorage.getItem('role') ?? 'student',
                    generalSkills: [],
                    majorSkills: [],
                })
                setTeammates([])
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [navigate, refetchGradProject, fetchInvitations])

    // ── Fetch projects from joined channels ───────────────────────────────────
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const channelsRes = await api.get('/channels/my')
                const channels: { id: number }[] = channelsRes.data

                const projectArrays = await Promise.all(
                    channels.map((ch) =>
                        api.get(`/channels/${ch.id}/projects`)
                            .then(r => r.data)
                            .catch(() => [])
                    )
                )

                const mapped: RecommendedProject[] = projectArrays
                    .flat()
                    .map((p: any) => ({
                        id: p.id,
                        title: p.name,
                        description: p.description ?? null,
                        lookingFor: p.requiredSkills ?? [],
                        matchScore: 0,
                        maxTeamSize: p.maxTeamSize ?? null,
                        dueDate: p.dueDate ?? null,
                        formationMode: p.formationMode ?? 'students',
                    }))

                setRecommendedProjects(mapped)
            } catch {
                setRecommendedProjects([])
            }
        }
        fetchProjects()
    }, [])

    const handleLogout = () => { localStorage.clear(); navigate('/login') }

    const handleGradSubmit = async () => {
        if (!gradForm.name.trim()) { setGradFormError('Project name is required.'); return }
        const size = parseInt(gradForm.teamSize)
        if (!gradForm.teamSize || isNaN(size) || size < 1) { setGradFormError('Please enter a valid team size.'); return }

        setGradSubmitting(true)
        setGradFormError(null)
        try {
            const skills = gradForm.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
            // POST /api/graduation-projects
            const res = await api.post('/graduation-projects', {
                name: gradForm.name.trim(),
                description: gradForm.description.trim() || null,
                requiredSkills: skills,
                partnersCount: size,
            })
            // Refetch from GET endpoint — guarantees isOwner/remainingSeats are populated
            setGradForm({ name: '', description: '', skills: '', teamSize: '' })
            setGradModalOpen(false)
            await refetchGradProject()
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to create project. Please try again.'
            setGradFormError(msg)
        } finally {
            setGradSubmitting(false)
        }
    }

    const handleDeleteProject = async () => {
        if (!gradProject) return
        if (!window.confirm('Are you sure you want to delete this project?')) return
        try {
            await api.delete(`/graduation-projects/${gradProject.id}`)
            // تحقق من الباك — يجب أن يرجع null بعد الحذف
            await refetchGradProject()
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to delete project.')
        }
    }

    const handleLeaveProject = async () => {
        if (!gradProject) return
        if (!window.confirm('Are you sure you want to leave this project?')) return
        try {
            await api.delete(`/graduation-projects/${gradProject.id}/leave`)
            // تحقق من الباك بعد المغادرة
            await refetchGradProject()
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to leave project.')
        }
    }

    const handleRemoveMember = async (memberStudentId: number) => {
        if (!gradProject) return

        setRemovingId(memberStudentId)
        setRemoveMsg(null)
        try {
            // Uses the typed API function — DELETE /graduation-projects/:id/members/:memberId
            // Response: { message, currentMembers } where currentMembers is the
            // authoritative post-deletion count from the DB.
            const result = await removeProjectMember(gradProject.id, memberStudentId)

            // Update team state from the backend's real count, not a local guess
            const updatedCount = result.currentMembers
            setTeamMembers(prev => prev.filter(m => m.studentId !== memberStudentId))
            setCurrentMembers(updatedCount)
            setIsFull(updatedCount >= gradProject.partnersCount)

            setRemoveMsg({ msg: '✓ Member removed.', ok: true })
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to remove member.'
            setRemoveMsg({ msg, ok: false })
        } finally {
            setRemovingId(null)
            setTimeout(() => setRemoveMsg(null), 3000)
        }
    }

    const handleMakeLeader = async (memberStudentId: number) => {
    if (!gradProject) return

    setPromotingId(memberStudentId)
    setLeaderMsg(null)

    try {
        // PUT /graduation-projects/:id/change-leader/:memberId
        // Backend swaps roles atomically: exactly one leader at all times.
        await changeProjectLeader(gradProject.id, memberStudentId)

        // 🔥 Update team members (optimistic UI)
        setTeamMembers(prev =>
            prev.map(m => {
                if (m.studentId === memberStudentId)
                    return { ...m, role: 'leader' as const }

                if (m.role === 'leader')
                    return { ...m, role: 'member' as const }

                return m
            })
        )

        // 🔥 FIX: update current user role
        if (memberStudentId === myStudentId) {
            setMyRole('leader')
        } else {
            setMyRole('member')
        }

        setLeaderMsg({ msg: '✓ Leader updated.', ok: true })

    } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to change leader.'
        setLeaderMsg({ msg, ok: false })
    } finally {
        setPromotingId(null)
        setTimeout(() => setLeaderMsg(null), 3000)
    }
}


    const handleJoinProject = async (projectId: number) => {
        try {
            await api.post(`/graduation-projects/${projectId}/join`)
            await refetchGradProject()
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to join project.')
        }
    }
const handleInvite = async (id: number, action: 'accept' | 'reject') => {
    setInviteLoading(id)
    setInviteMsg(null)

    try {
        await api.post(`/invitations/${id}/${action}`)

        setInvitations(prev => {
            const updated = prev.filter(i => i.id !== id)
            setPendingCount(updated.length)
            return updated
        })

        setInviteMsg({
            id,
            msg: action === 'accept' ? '✅ Invitation accepted!' : '❌ Invitation rejected.',
            ok: action === 'accept'
        })

        await fetchInvitations()

        // ✅ الحل هون
        if (action === 'accept') {
            await refetchGradProject()
        }

    } catch (err: any) {
        const msg = err?.response?.data?.message || (action === 'accept' ? 'Failed to accept.' : 'Failed to reject.')
        setInviteMsg({ id, msg, ok: false })
    } finally {
        setInviteLoading(null)
        setTimeout(() => setInviteMsg(null), 3000)
    }
}
    const handleFindSupervisors = async () => {
        if (!gradProject) return

        setSupervisorMsg(null)

        try {
            setLoadingSup(true)
            const data = await getRecommendedSupervisors(gradProject.id)
            setSupervisors(data)
            setShowSupervisors(true)
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to load supervisors.'
            setSupervisorMsg({ msg, ok: false })
        } finally {
            setLoadingSup(false)
        }
    }

    const handleRequestSupervisor = async (doctorId: number) => {
        if (!gradProject || requestingSupervisorId) return

        setRequestingSupervisorId(doctorId)
        setSupervisorMsg(null)

        try {
            const result = await requestSupervisor(gradProject.id, doctorId)

            // Find the requested supervisor's info from the list
            const chosenSupervisor = supervisors.find(s => s.doctorId === doctorId)
            if (chosenSupervisor) {
                const supData = {
                    name: chosenSupervisor.name,
                    specialization: chosenSupervisor.specialization || '',
                }
                localStorage.setItem(
                    `project_supervisor_${gradProject.id}`,
                    JSON.stringify(supData)
                )
                setLocalSupervisor(supData)
            }

            setSupervisorMsg({
                msg: result?.message || 'Supervisor request sent successfully.',
                ok: true,
            })

            setTimeout(() => setSupervisorMsg(null), 3000)
            setShowSupervisors(false)
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to send supervisor request.'
            setSupervisorMsg({ msg, ok: false })
        } finally {
            setRequestingSupervisorId(null)
        }
    }

    const openEditInfo = () => {
        setEditInfoOpen(true)
    }

    const handleSaveInfo = async () => {
        // PUT /api/profile لا يدعم الحقول الأكاديمية (university, major, gpa, etc.)
        // EditProfilePage هي المكان الصحيح لتعديل هالمعلومات
        navigate('/edit-profile')
    }

    const allSkills = [...(user?.generalSkills || []), ...(user?.majorSkills || [])]
    const completeness = Math.min(
        20 + (user?.university ? 15 : 0) + (user?.major ? 15 : 0) +
        (allSkills.length > 0 ? 20 : 0) + (user?.gpa ? 10 : 0) + (user?.profilePic ? 20 : 0), 100
    )

    // ── Team management permission ────────────────────────────────────────────
    // true  → show Remove / Make Leader buttons on non-leader member rows.
    // false → member rows are read-only (regular member, or no project).
    //
    // Currently granted to:
    //   - 'owner'  — the project creator (always has full control)
    //   - 'leader' — a designated team lead (backend allows them to manage too)
    //
    // myRole comes directly from the GET /my response envelope, so it never
    // requires scanning teamMembers to find the current user.




    const PROFILE_TASKS = [
        { id: '1', label: 'Add a profile picture', done: !!user?.profilePic, link: '/edit-profile#basic' },
        { id: '2', label: 'Add general skills', done: (user?.generalSkills?.length || 0) > 0, link: '/edit-profile#skills' },
        { id: '3', label: 'Add major skills', done: (user?.majorSkills?.length || 0) > 0, link: '/edit-profile#skills' },
        { id: '4', label: 'Complete academic info', done: !!user?.major && !!user?.university, link: '/edit-profile#basic' },
        { id: '5', label: 'Add preferred project topics', done: false, link: '/edit-profile#work' },
    ]

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
            <div style={{ textAlign: 'center' as const }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                                <Bell size={17} />
                                {pendingCount > 0 && (
                                    <span style={S.inviteBadge}>{pendingCount > 9 ? '9+' : pendingCount}</span>
                                )}
                            </button>
                            {notifOpen && (
                                <div style={S.notifDropdown}>
                                    <p style={S.notifTitle}>🔔 Notifications</p>
                                    {invitations.length === 0 ? (
                                        <div style={S.notifItem}>No new notifications</div>
                                    ) : (
                                        invitations.slice(0, 5).map(inv => (
                                            <div key={inv.id} style={{ ...S.notifItem, cursor: 'default' }}>
                                                <strong>{inv.invitedBy}</strong> invited you to join <strong>{inv.project}</strong>
                                            </div>
                                        ))
                                    )}
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
                                : <div style={S.navAvatarFallback}>{user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
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
                        <h1 style={S.heroName}>Welcome back, <span style={S.heroNameAccent}>{user?.name?.split(' ')[0]}</span></h1>
                        <p style={S.heroSub}>{[user?.major, user?.academicYear, user?.university].filter(Boolean).join(' · ') || 'Complete your profile to get started'}</p>
                        <div style={S.heroSkills}>
                            {allSkills.length > 0
                                ? allSkills.slice(0, 5).map((s: string) => <span key={s} style={S.skillChip}>{s}</span>)
                                : <Link to="/profile" style={{ ...S.skillChip, textDecoration: 'none', opacity: 0.7 }}>+ Add your skills</Link>
                            }
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' as const }}>
                            <Link to="/edit-profile" style={S.heroBtn}>✏️ Edit Profile</Link>
                            <Link to="/profile" style={{ ...S.heroBtn, background: 'white', color: '#6366f1', border: '1.5px solid #c7d2fe' }}>
                                👤 View Full Profile
                            </Link>
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
                            { icon: <Briefcase size={18} />, label: 'Matched Projects', value: recommendedProjects.length > 0 ? `${recommendedProjects.length}` : '—' },
                            { icon: <Trophy size={18} />, label: 'Best Match', value: teammates.length > 0 ? `${teammates[0].matchScore}%` : '—' },
                            { icon: <UserPlus size={18} />, label: 'Team Invitations', value: invitations.length > 0 ? `${invitations.length}` : '—' },
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
                                <button onClick={openEditInfo} style={S.cardActionBtn}>Edit <ChevronRight size={12} /></button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                                {[
                                    { label: 'Email', value: user?.email },
                                    { label: 'University', value: user?.university },
                                    { label: 'Faculty', value: user?.faculty },
                                    { label: 'Major', value: user?.major },
                                    { label: 'Year', value: user?.academicYear },
                                    { label: 'GPA', value: user?.gpa },
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
                            {applications.length === 0 ? (
                                <div style={S.emptyState}>
                                    <span style={{ fontSize: 24 }}>📋</span>
                                    <p style={S.emptyDesc}>No applications yet</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                                    {applications.map(app => (
                                        <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{app.project}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: app.status === 'Accepted' ? '#dcfce7' : '#fef9c3', color: app.status === 'Accepted' ? '#16a34a' : '#a16207' }}>{app.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                                <button disabled={inviteLoading === inv.id} onClick={() => handleInvite(inv.id, 'accept')}
                                                    style={{ flex: 1, padding: '7px', background: inviteLoading === inv.id ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#a855f7)', color: inviteLoading === inv.id ? '#94a3b8' : 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: inviteLoading === inv.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                                    {inviteLoading === inv.id ? '⏳' : '✅ Accept'}
                                                </button>
                                                <button disabled={inviteLoading === inv.id} onClick={() => handleInvite(inv.id, 'reject')}
                                                    style={{ flex: 1, padding: '7px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: inviteLoading === inv.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                                    ✕ Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* My Graduation Project */}
                        <div style={S.card}>
                            <div style={S.cardHeader}>
                                <h3 style={S.cardTitle}>🎓 My Graduation Project</h3>
                                {!gradProject && !gradLoading && (
                                    <button onClick={() => setGradModalOpen(true)} style={S.cardActionBtn}>
                                        + Create <ChevronRight size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Loading */}
                            {gradLoading && (
                                <div style={S.emptyState}>
                                    <p style={{ fontSize: 12, color: '#94a3b8' }}>⏳ Loading...</p>
                                </div>
                            )}

                            {/* No project */}
                            {!gradLoading && !gradProject && (
                                <div style={S.emptyState}>
                                    <span style={{ fontSize: 24 }}>📝</span>
                                    <p style={S.emptyTitle}>No project yet</p>
                                    <p style={S.emptyDesc}>Create your graduation project and find teammates</p>
                                    <button onClick={() => setGradModalOpen(true)}
                                        style={{ marginTop: 8, padding: '7px 16px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        Create Graduation Project
                                    </button>
                                </div>
                            )}

                            {/* Project exists */}
                            {!gradLoading && gradProject && (
                                <div style={{ padding: '14px', background: 'linear-gradient(135deg,rgba(99,102,241,0.05),rgba(168,85,247,0.05))', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>

                                    {/* Header: name + role badge + action */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>{gradProject.name}</p>
                                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', background: gradProject.isOwner ? 'linear-gradient(135deg,#6366f1,#a855f7)' : '#e0e7ff', color: gradProject.isOwner ? 'white' : '#6366f1', borderRadius: 20 }}>
                                                {gradProject.isOwner ? '👑 Owner' : '👥 Member'}
                                            </span>
                                        </div>
                                        {gradProject.isOwner ? (
                                            <button onClick={handleDeleteProject}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, fontFamily: 'inherit', padding: '2px 6px', borderRadius: 6 }}>
                                                🗑 Delete
                                            </button>
                                        ) : (
                                            <button onClick={handleLeaveProject}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 11, fontFamily: 'inherit', padding: '2px 6px', borderRadius: 6 }}>
                                                Leave
                                            </button>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {gradProject.description && (
                                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{gradProject.description}</p>
                                    )}

                                    {/* Owner name */}
                                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px', fontWeight: 500 }}>
                                        by {gradProject.ownerName ?? '—'}
                                    </p>

                                    {/* Required skills */}
                                    {(gradProject.requiredSkills ?? []).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 }}>
                                            {(gradProject.requiredSkills ?? []).map((sk: string) => <span key={sk} style={S.skillChipSm}>{sk}</span>)}
                                        </div>
                                    )}

                                    {/* ── Team Members ── */}
                                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(99,102,241,0.12)', paddingTop: 12 }}>

                                        {/* Header: label + count + full badge */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Users size={12} color="#6366f1" />
                                                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                                                    Team
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                {/* Count pill — always visible */}
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: 20 }}>
                                                    {currentMembers} / {gradProject.partnersCount}
                                                </span>
                                                {/* Full badge — replaces "X seats left" when team is complete */}
                                                {isFull
                                                    ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', borderRadius: 20 }}>✓ Full</span>
                                                    : <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>
                                                        {Math.max(0, gradProject.partnersCount - currentMembers)} seat{Math.max(0, gradProject.partnersCount - currentMembers) !== 1 ? 's' : ''} open
                                                      </span>
                                                }
                                            </div>
                                        </div>

                                        {/* Member rows */}
                                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                                            {teamMembers.length === 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                                                    <Users size={13} color="#cbd5e1" />
                                                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>No members yet — invite students to join</span>
                                                </div>
                                            ) : teamMembers.map(m => (
                                                <TeamMemberRow
                                                    key={m.studentId}
                                                    member={m}
                                                    
canManageTeam={myRole === 'owner' || myRole === ('leader' as any)}
                                                    isSelf={myStudentId !== null && m.studentId === myStudentId}
                                                    isRemoving={removingId === m.studentId}
                                                    onRemove={() => handleRemoveMember(m.studentId)}
                                                    isPromoting={promotingId === m.studentId}
                                                    onMakeLeader={() => handleMakeLeader(m.studentId)}
                                                />
                                            ))}
                                        </div>

                                        {/* Inline action feedback — removal or leader change */}
                                        {(removeMsg || leaderMsg) && (
                                            <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: (removeMsg ?? leaderMsg)!.ok ? '#16a34a' : '#ef4444' }}>
                                                {(removeMsg ?? leaderMsg)!.msg}
                                            </p>
                                        )}

                                        {/* Footer: browse button (owner, not full) or complete notice */}
                                        {gradProject.isOwner && !isFull && (
                                            <button
                                                onClick={() => navigate(`/students?projectId=${gradProject.id}`)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, padding: '6px 12px', background: 'white', border: '1.5px solid #c7d2fe', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#6366f1', cursor: 'pointer', fontFamily: 'inherit' }}
                                            >
                                                <UserPlus size={12} /> Browse Students to Join
                                            </button>
                                        )}
                                        {isFull && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
                                                <CheckCircle2 size={13} color="#10b981" />
                                                <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}>Team is complete</span>
                                            </div>
                                        )}

                                    </div>{/* end team section */}

                                    {/* ── Supervisor Section ── */}
                                    <div style={{ marginTop: 14, borderTop: '1px solid rgba(99,102,241,0.12)', paddingTop: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                            <div>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                                                    Supervisor
                                                </p>
                                                {localSupervisor ? (
                                                    <div>
                                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
                                                            {localSupervisor.name}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                                                            {localSupervisor.specialization}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                                                        No supervisor assigned yet
                                                    </p>
                                                )}
                                            </div>

                                            {!localSupervisor && (myRole === 'owner' || myRole === 'leader') && (
                                                <button
                                                    onClick={handleFindSupervisors}
                                                    disabled={loadingSup}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'white',
                                                        border: '1.5px solid #c7d2fe',
                                                        borderRadius: 8,
                                                        color: '#6366f1',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: loadingSup ? 'not-allowed' : 'pointer',
                                                        fontFamily: 'inherit',
                                                        opacity: loadingSup ? 0.6 : 1,
                                                    }}
                                                >
                                                    {loadingSup ? 'Loading...' : 'Find Supervisor'}
                                                </button>
                                            )}
                                        </div>

                                        {supervisorMsg && (
                                            <p style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 600, color: supervisorMsg.ok ? '#16a34a' : '#ef4444' }}>
                                                {supervisorMsg.msg}
                                            </p>
                                        )}
                                    </div>

                                    {/* ── Open Project Button ── */}
                                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(99,102,241,0.12)' }}>
                                        <button
                                            onClick={() => navigate(`/project/${gradProject.id}`)}
                                            style={{
                                                width: '100%',
                                                padding: '9px 0',
                                                background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 10,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            🚀 Open Project Workspace
                                        </button>
                                    </div>
                                </div>
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
                                <p style={S.emptyDesc}>Your recent actions will appear here</p>
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
                                                    : <div style={S.teammateAvatarFallback}>{t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                                                }
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{t.name}</p>
                                                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{t.major}</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                                                    {t.skills.slice(0, 3).map((s: string) => <span key={s} style={S.skillChipSm}>{s}</span>)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                                                <div style={S.matchBadge}>
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{t.matchScore}%</span>
                                                    <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Match</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => navigate(`/profile/${t.userId}`)} style={S.btnSm}>View</button>
                                                    <button onClick={() => alert(`Invitation sent to ${t.name}!`)}
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
                                {recommendedProjects.length === 0 ? (
                                    <div style={S.emptyState}>
                                        <span style={{ fontSize: 28 }}>📁</span>
                                        <p style={S.emptyTitle}>No recommendations yet</p>
                                        <p style={S.emptyDesc}>Join a channel or add skills to get project recommendations</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                                        {recommendedProjects.map(p => (
                                            <div key={p.id} style={S.projectCard}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{p.title}</p>
                                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 6 }}>
                                                        {p.dueDate && (
                                                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                                                                📅 {new Date(p.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                        {p.maxTeamSize != null && (
                                                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>👥 Max {p.maxTeamSize} students</span>
                                                        )}
                                                    </div>
                                                    {p.lookingFor.length > 0 && (
                                                        <>
                                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px', fontWeight: 500 }}>Looking for:</p>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                                                                {p.lookingFor.map((r: string) => <span key={r} style={{ ...S.skillChipSm, background: '#faf5ff', color: '#a855f7', borderColor: '#e9d5ff' }}>{r}</span>)}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                                                    <button onClick={() => navigate(`/projects/${p.id}`)}
                                                        style={{ ...S.btnSm, background: 'linear-gradient(135deg,#a855f7,#6366f1)', color: 'white', border: 'none' }}>
                                                        View Project
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ── EDIT INFO MODAL ── */}
            {editInfoOpen && (
                <div style={S.modalOverlay} onClick={() => setEditInfoOpen(false)}>
                    <div style={S.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>✏️ Edit My Info</h3>
                            <button onClick={() => setEditInfoOpen(false)} style={S.modalCloseBtn}><X size={15} /></button>
                        </div>
                        {/* عرض المعلومات الحالية فقط للقراءة */}
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 20 }}>
                            {[
                                { label: 'Email', value: user?.email },
                                { label: 'University', value: user?.university },
                                { label: 'Faculty', value: user?.faculty },
                                { label: 'Major', value: user?.major },
                                { label: 'Academic Year', value: user?.academicYear },
                                { label: 'GPA', value: user?.gpa },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{item.label}</span>
                                    <span style={{ fontSize: 12, color: item.value ? '#334155' : '#cbd5e1', fontWeight: 600 }}>{item.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 18px', textAlign: 'center' as const }}>
                            لتعديل هذه المعلومات، استخدم صفحة تعديل الملف الشخصي
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setEditInfoOpen(false)} style={S.modalCancelBtn}>Close</button>
                            <button
                                onClick={handleSaveInfo}
                                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ✏️ Go to Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── BROWSE PROJECTS MODAL ── */}
            {projectsModalOpen && (
                <div style={S.modalOverlay} onClick={() => setProjectsModalOpen(false)}>
                    <div style={{ ...S.modalBox, width: 600, maxHeight: '85vh', overflowY: 'auto' as const }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>📁 Browse Projects</h3>
                            <button onClick={() => setProjectsModalOpen(false)} style={S.modalCloseBtn}><X size={15} /></button>
                        </div>
                        <div style={{ ...S.aiBanner, marginBottom: 16 }}>
                            <Sparkles size={15} color="#a855f7" />
                            <p style={{ margin: 0, fontSize: 12, color: '#4c1d95', fontWeight: 600 }}>Showing projects matched to your skills — sorted by best fit</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                            {recommendedProjects.length === 0 ? (
                                <div style={S.emptyState}>
                                    <span style={{ fontSize: 32 }}>📁</span>
                                    <p style={S.emptyTitle}>No projects available yet</p>
                                    <p style={S.emptyDesc}>Projects from your channels will appear here once published by your doctor.</p>
                                </div>
                            ) : recommendedProjects.map(project => (
                                <div key={project.id}
                                    style={{ padding: '16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#c7d2fe')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{project.title}</p>
                                            {project.description && <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{project.description}</p>}
                                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                                                {project.dueDate && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>📅 Due {new Date(project.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                                                {project.maxTeamSize != null && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>👥 Max {project.maxTeamSize} students</span>}
                                            </div>
                                            {project.lookingFor.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginRight: 2 }}>Looking for:</span>
                                                    {project.lookingFor.map((r: string) => <span key={r} style={{ ...S.skillChipSm, background: '#faf5ff', color: '#a855f7', borderColor: '#e9d5ff' }}>{r}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => navigate(`/projects/${project.id}`)}
                                            style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
                                            View Project
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 20, textAlign: 'center' as const }}>
                            <button onClick={() => { setProjectsModalOpen(false); navigate('/projects') }}
                                style={{ padding: '10px 28px', background: 'white', border: '1.5px solid #c7d2fe', borderRadius: 10, color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                View All Projects →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── JOIN CHANNEL MODAL ── */}
            {joinChannelOpen && (
                <div style={S.modalOverlay} onClick={() => setJoinChannelOpen(false)}>
                    <div style={S.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>🔗 Join Channel</h3>
                            <button onClick={() => setJoinChannelOpen(false)} style={S.modalCloseBtn}><X size={15} /></button>
                        </div>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 14px' }}>Enter the invite code shared by your doctor.</p>
                        <input
                            style={S.modalInput}
                            placeholder="e.g. CS101-A2"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                            <button onClick={() => { setJoinChannelOpen(false); setJoinCode('') }} style={S.modalCancelBtn}>Cancel</button>
                            <button
                                disabled={!joinCode.trim()}
                                onClick={async () => {
                                    try {
                                        await api.post('/channels/join', { code: joinCode.trim() })
                                        setJoinChannelOpen(false)
                                        setJoinCode('')
                                    } catch {
                                        alert('Invalid code or channel not found.')
                                    }
                                }}
                                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: joinCode.trim() ? 'linear-gradient(135deg,#6366f1,#a855f7)' : '#e2e8f0', color: joinCode.trim() ? 'white' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: joinCode.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CREATE GRADUATION PROJECT MODAL ── */}
            {gradModalOpen && (
                <div style={S.modalOverlay} onClick={() => { setGradModalOpen(false); setGradFormError(null) }}>
                    <div style={S.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>🎓 Create Graduation Project</h3>
                            <button onClick={() => { setGradModalOpen(false); setGradFormError(null) }} style={S.modalCloseBtn}><X size={15} /></button>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Project Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input style={S.modalInput} placeholder="e.g. Smart Health Monitoring System" value={gradForm.name} onChange={e => setGradForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Description</label>
                            <textarea rows={3} style={{ ...S.modalInput, resize: 'vertical' as const, lineHeight: 1.5 }} placeholder="Brief description..." value={gradForm.description} onChange={e => setGradForm(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Required Skills <span style={{ color: '#94a3b8', fontWeight: 400 }}>(comma separated)</span></label>
                            <input style={S.modalInput} placeholder="e.g. React, Python, Machine Learning" value={gradForm.skills} onChange={e => setGradForm(p => ({ ...p, skills: e.target.value }))} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Number of Partners <span style={{ color: '#ef4444' }}>*</span></label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} type="button" onClick={() => setGradForm(p => ({ ...p, teamSize: String(n) }))}
                                        style={{ width: 42, height: 42, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid', borderColor: gradForm.teamSize === String(n) ? '#6366f1' : '#e2e8f0', background: gradForm.teamSize === String(n) ? '#eef2ff' : '#f8fafc', color: gradForm.teamSize === String(n) ? '#6366f1' : '#64748b' }}>
                                        {n}
                                    </button>
                                ))}
                                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
                                    {gradForm.teamSize ? `${gradForm.teamSize} partner${gradForm.teamSize === '1' ? '' : 's'}` : 'Select'}
                                </span>
                            </div>
                        </div>
                        {gradFormError && (
                            <div style={{ padding: '9px 12px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#ef4444', fontWeight: 500, marginBottom: 14 }}>❌ {gradFormError}</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => { setGradModalOpen(false); setGradFormError(null) }} style={S.modalCancelBtn}>Cancel</button>
                            <button onClick={handleGradSubmit} disabled={gradSubmitting}
                                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: gradSubmitting ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#a855f7)', color: gradSubmitting ? '#94a3b8' : 'white', fontSize: 13, fontWeight: 700, cursor: gradSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                {gradSubmitting ? '⏳ Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADD TEAMMATES MODAL ── */}
            {addTeammatesOpen && (
                <div style={S.modalOverlay} onClick={() => setAddTeammatesOpen(false)}>
                    <div style={{ ...S.modalBox, width: 480 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>👥 Find Teammates</h3>
                            <button onClick={() => setAddTeammatesOpen(false)} style={S.modalCloseBtn}><X size={15} /></button>
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 }}>
                            Browse students, check their profiles and skills, then share your project link so they can join directly.
                        </p>

                        {/* AI Suggestions */}
                        {teammates.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 8px' }}>
                                    AI Suggested ({teammates.length})
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, maxHeight: 260, overflowY: 'auto' as const }}>
                                    {teammates.slice(0, 5).map(t => (
                                        <div key={t.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                                                {t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{t.name}</p>
                                                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{t.major}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>{t.matchScore}%</span>
                                                <button
                                                    onClick={() => { navigate(`/students/${t.userId}`); setAddTeammatesOpen(false) }}
                                                    style={{ padding: '4px 10px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setAddTeammatesOpen(false)} style={S.modalCancelBtn}>Close</button>
                            <button
                                onClick={() => {
                                    // Pass projectId so StudentsPage knows which project to link against
                                    const dest = gradProject
                                        ? `/students?projectId=${gradProject.id}`
                                        : '/students'
                                    navigate(dest)
                                    setAddTeammatesOpen(false)
                                }}
                                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Browse All Students →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSupervisors && (
                <div style={S.modalOverlay} onClick={() => setShowSupervisors(false)}>
                    <div style={{ ...S.modalBox, width: 520 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' }}>
                                🎓 Recommended Supervisors
                            </h3>
                            <button onClick={() => setShowSupervisors(false)} style={S.modalCloseBtn}>
                                <X size={15} />
                            </button>
                        </div>

                        {supervisors.length === 0 ? (
                            <div style={S.emptyState}>
                                <span style={{ fontSize: 28 }}>🧑‍🏫</span>
                                <p style={S.emptyTitle}>No supervisors found</p>
                                <p style={S.emptyDesc}>No suitable supervisors are available for this project right now.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                                {supervisors.map(s => (
                                    <div
                                        key={s.doctorId}
                                        style={{
                                            padding: '12px 14px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                        }}
                                    >
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                                {s.name}
                                            </p>
                                            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748b' }}>
                                                {s.specialization || 'No specialization'}
                                            </p>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                                                Match: {s.matchScore}%
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleRequestSupervisor(s.doctorId)}
                                            disabled={requestingSupervisorId === s.doctorId}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: requestingSupervisorId === s.doctorId ? 'not-allowed' : 'pointer',
                                                fontFamily: 'inherit',
                                                opacity: requestingSupervisorId === s.doctorId ? 0.6 : 1,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {requestingSupervisorId === s.doctorId ? 'Sending...' : 'Request'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input:focus, textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        button:hover { opacity: 0.9; }
        a { text-decoration: none; }
      `}</style>
        </div>
    )
}

// ─── TeamMemberRow ────────────────────────────────────────────────────────────
// Renders a single team member as a clean horizontal row.
//
// canManageTeam — when true, non-leader rows show Remove + Make Leader buttons.
// isSelf        — true when this row belongs to the currently logged-in user.
//                 Hides the Remove button on their own row regardless of role.
// isRemoving    — disables Remove and fades the row while DELETE is in flight.
// onRemove      — called on Remove click; handler lives in DashboardPage.
// isPromoting   — disables Make Leader while PUT is in flight for this member.
// onMakeLeader  — called on Make Leader click; handler lives in DashboardPage.
//
// Leader rows never show action buttons regardless of canManageTeam.
interface TeamMemberRowProps {
    member: GradProjectMember
    canManageTeam: boolean
    isSelf: boolean
    isRemoving: boolean
    onRemove: () => void
    isPromoting: boolean
    onMakeLeader: () => void
}
function TeamMemberRow({ member: m, canManageTeam, isSelf, isRemoving, onRemove, isPromoting, onMakeLeader }: TeamMemberRowProps) {
    const isLeader    = m.role === 'leader'
    // Actions area is shown only when the manager can act AND the row is not the
    // leader row. Individual buttons may still be hidden (e.g. Remove for self).
    const showActions = canManageTeam && !isLeader
    const canRemove   = showActions && !isSelf
    const isBusy      = isRemoving || isPromoting
    const initials    = m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div style={{
            ...S.memberRow,
            ...(isLeader ? S.memberRowLeader : S.memberRowMember),
            opacity: isBusy ? 0.5 : 1,
        }}>
            {/* Left: avatar + text */}
            <div style={S.memberLeft}>

                {/* Avatar */}
                <div style={{
                    ...S.memberAvatarWrap,
                    boxShadow: isLeader ? '0 0 0 2px #a5b4fc' : 'none',
                }}>
                    {m.profilePicture
                        ? <img src={m.profilePicture} alt={m.name} style={S.memberAvatarImg} />
                        : <div style={isLeader ? S.memberAvatarFallbackLeader : S.memberAvatarFallbackMember}>
                            {initials}
                          </div>
                    }
                </div>

                {/* Name + sub-line */}
                <div style={S.memberText}>
                    <div style={S.memberNameRow}>
                        <span style={S.memberName}>{m.name}</span>
                        <span style={isLeader ? S.memberBadgeLeader : S.memberBadgeMember}>
                            {isLeader ? '👑 Leader' : 'Member'}
                        </span>
                        {isSelf && (
                            <span style={S.memberBadgeSelf}>You</span>
                        )}
                    </div>
                    <span style={S.memberSub}>
                        {m.major || m.university || '—'}
                    </span>
                </div>

            </div>

            {/* Right: actions — only for non-leader rows when canManageTeam */}
            {showActions && (
                <div style={S.memberActions}>
                    {canRemove && (
                        <button
    onClick={onRemove}
    disabled={isBusy}
    style={{
        ...S.memberBtnRemove,
        cursor: isBusy ? 'not-allowed' : 'pointer',
        opacity: isBusy ? 0.5 : 1,
        padding: '4px 5px',   // 👈 أصغر
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}
>
    {isRemoving ? '…' : '🗑'}
</button>
                    )}
                    
                </div>
            )}
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
    page: { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
    nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
    navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 16 },
    navLogo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8, flexShrink: 0 },
    logoIconWrap: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
    logoText: { fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
    logoAccent: { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    searchWrap: { flex: 1, maxWidth: 420, position: 'relative' },
    searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' },
    searchInput: { width: '100%', padding: '9px 14px 9px 36px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#0f172a', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
    navActions: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' },
    navBtn: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: 8, position: 'relative', textDecoration: 'none' },
    notifDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#6366f1', border: '1.5px solid #f8f7ff' },
    inviteBadge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #f8f7ff', fontSize: 9, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' },
    navAvatar: { width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', marginLeft: 4, textDecoration: 'none', flexShrink: 0 },
    navAvatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' },
    notifDropdown: { position: 'absolute', top: 44, right: 0, width: 280, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'hidden' },
    notifTitle: { fontSize: 13, fontWeight: 700, color: '#334155', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', margin: 0 },
    notifItem: { fontSize: 13, color: '#475569', padding: '10px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer' },
    content: { maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },
    hero: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24, padding: '24px 28px', background: 'white', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, boxShadow: '0 4px 24px rgba(99,102,241,0.06)' },
    heroLeft: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start' },
    greetingText: { fontSize: 13, color: '#94a3b8', margin: '0 0 4px', fontWeight: 500 },
    heroName: { fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px', fontFamily: 'Syne, sans-serif', display: 'block', lineHeight: 1.2 },
    heroNameAccent: { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline' },
    heroSub: { fontSize: 13, color: '#64748b', margin: '0 0 12px', display: 'block' },
    heroSkills: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    skillChip: { padding: '4px 12px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, color: '#6366f1', fontWeight: 600 },
    heroBtn: { padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 },
    heroStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 },
    statCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 },
    statIcon: { width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6366f1' },
    statValue: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 2px', fontFamily: 'Syne, sans-serif' },
    statLabel: { fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 500 },
    aiBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'linear-gradient(135deg,rgba(168,85,247,0.08),rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, marginBottom: 4 },
    grid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' },
    leftCol: { display: 'flex', flexDirection: 'column', gap: 14 },
    rightCol: { display: 'flex', flexDirection: 'column', gap: 14 },
    card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px', boxShadow: '0 2px 12px rgba(99,102,241,0.04)' },
    cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    cardTitle: { fontSize: 11, fontWeight: 700, color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.08em' },
    cardAction: { display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
    cardActionBtn: { display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
    progressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
    progressTrack: { flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 3, transition: 'width 0.6s ease' },
    progressPct: { fontSize: 15, fontWeight: 800, color: '#6366f1', minWidth: 36 },
    progressLabel: { fontSize: 12, color: '#94a3b8', margin: '0 0 12px' },
    filterRow: { display: 'flex', gap: 6, marginBottom: 4 },
    filterBtn: { padding: '7px 16px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 20, color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    filterBtnActive: { background: '#eef2ff', border: '1.5px solid #c7d2fe', color: '#6366f1' },
    teammateCard: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' },
    teammateAvatar: { width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' },
    teammateAvatarFallback: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', borderRadius: '50%' },
    projectCard: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' },
    matchBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 },
    skillChipSm: { padding: '3px 8px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 10, color: '#6366f1', fontWeight: 600 },
    btnSm: { padding: '5px 12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 8, textAlign: 'center' },
    emptyTitle: { fontSize: 14, fontWeight: 700, color: '#475569', margin: 0 },
    emptyDesc: { fontSize: 12, color: '#94a3b8', margin: 0, maxWidth: 260, lineHeight: 1.6 },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)' },
    modalBox: { background: 'white', borderRadius: 20, padding: '28px', width: 440, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(99,102,241,0.18)' },
    modalInput: { width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#0f172a', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8fafc' },
    modalCloseBtn: { width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' },
    modalCancelBtn: { padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    // ── Team member row ───────────────────────────────────────────────────────
    memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 11px', borderRadius: 10, boxSizing: 'border-box' as const, transition: 'opacity 0.2s' },
    memberRowLeader: { background: '#eef2ff', border: '1px solid rgba(99,102,241,0.25)' },
    memberRowMember: { background: '#f8fafc', border: '1px solid #e2e8f0' },
    memberLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
    memberAvatarWrap: { width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 },
    memberAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
    memberAvatarFallbackLeader: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' },
    memberAvatarFallbackMember: { width: '100%', height: '100%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' },
    memberText: { flex: 1, minWidth: 0, overflow: 'hidden' },
    memberNameRow: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 },
    memberName: { fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    memberBadgeLeader: { flexShrink: 0, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white' },
    memberBadgeMember: { flexShrink: 0, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' },
    memberBadgeSelf: { flexShrink: 0, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    memberSub: { fontSize: 11, color: '#94a3b8', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
   memberActions: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
    alignItems: 'center',
    marginLeft: 'auto'   // 🔥 هذا أهم تعديل
},
    memberBtnRemove: { padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: '1px solid #fecaca', background: '#fff1f2', color: '#ef4444', fontFamily: 'inherit' },
    memberBtnLeader: { padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#6366f1', fontFamily: 'inherit' },
}