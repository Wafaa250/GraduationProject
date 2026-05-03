import { useState, useEffect, type CSSProperties, type FormEvent } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Pencil,
  MapPin,
  GraduationCap,
  BookOpen,
  Star,
  Zap,
  Users,
  LayoutDashboard,
  Sparkles,
  X,
} from "lucide-react"
import { apiClient } from "../../../api/client"
import { parseApiErrorMessage } from "../../../api/axiosInstance"
import { navigateHome } from "../../../utils/homeNavigation"

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentProfile {
  userId: number
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

interface ProfileTask {
  id: string
  label: string
  done: boolean
  link: string
}

type SkillKind = "general" | "major"
type ProfileMode = "me" | "public"
type StudentTab = "about" | "skills" | "projects"

interface PublicProject {
  id: number
  name: string
  abstract: string
}

const FALLBACK_STUDENT: StudentProfile = {
  userId: 0,
  name: "Student",
  email: "",
  role: "student",
  university: "",
  faculty: "",
  major: "",
  academicYear: "",
  gpa: "",
  generalSkills: [],
  majorSkills: [],
  profilePic: null,
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentId } = useParams<{ studentId?: string }>()
  const [user, setUser] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<StudentTab>("about")
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([])

  const mode: ProfileMode = location.pathname === "/profile" ? "me" : "public"
  const isPublic = mode === "public"

  /** Session-only skills (not persisted; merged with /me data for display). */
  const [addedGeneralSkills, setAddedGeneralSkills] = useState<string[]>([])
  const [addedMajorSkills, setAddedMajorSkills] = useState<string[]>([])

  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [skillNameInput, setSkillNameInput] = useState('')
  const [skillKind, setSkillKind] = useState<SkillKind>('general')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        if (mode === "me") {
          const token = localStorage.getItem("token")
          if (!token) {
            navigate("/login")
            return
          }
          const res = await apiClient.get("/me")
          const data = res.data
          setUser({
            userId: Number(data.userId ?? data.id ?? 0),
            name: data.name || data.fullName,
            email: data.email,
            role: data.role || localStorage.getItem("role") || "student",
            university: data.university,
            faculty: data.faculty,
            major: data.major,
            academicYear: data.academicYear,
            gpa: data.gpa,
            generalSkills: data.generalSkills || [],
            majorSkills: data.majorSkills || [],
            profilePic: data.profilePictureBase64 || null,
          })
        } else {
          const id = Number(studentId)
          if (!Number.isFinite(id) || id <= 0) return
          const res = await apiClient.get(`/students/${id}`)
          const raw = res.data ?? {}
          const profile = raw.studentProfile ?? raw.StudentProfile ?? {}
          const linkedUser = raw.user ?? raw.User ?? {}
          setUser({
            userId: Number(raw.userId ?? linkedUser.id ?? raw.id ?? 0),
            name: raw.name || raw.fullName || "Student",
            email: raw.email || "",
            role: "student",
            university: raw.university || profile.university || profile.University || "",
            faculty: raw.faculty || profile.faculty || profile.Faculty || "",
            major: raw.major || profile.major || profile.Major || "",
            academicYear: raw.academicYear || profile.academicYear || profile.AcademicYear || "",
            gpa: String(raw.gpa ?? profile.gpa ?? "").trim(),
            generalSkills: Array.isArray(raw.generalSkills) ? raw.generalSkills : [],
            majorSkills: Array.isArray(raw.majorSkills) ? raw.majorSkills : [],
            profilePic: raw.profilePictureBase64 || profile.profilePictureBase64 || null,
          })
          try {
            const projectsRes = await apiClient.get("/graduation-projects", { params: { studentId: id } })
            const rows = Array.isArray(projectsRes.data) ? projectsRes.data : []
            setPublicProjects(
              rows.map((p: any) => ({
                id: Number(p.id ?? p.Id ?? 0),
                name: p.name ?? p.title ?? "Untitled Project",
                abstract: p.abstract ?? p.description ?? "",
              })),
            )
          } catch {
            setPublicProjects([])
          }
        }
      } catch {
        setUser(FALLBACK_STUDENT)
        setPublicProjects([])
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    void fetchProfile()
  }, [mode, studentId, navigate])

  const generalSkills = [...(user?.generalSkills ?? []), ...addedGeneralSkills]
  const majorSkills = [...(user?.majorSkills ?? []), ...addedMajorSkills]
  const allSkills = [...generalSkills, ...majorSkills]

  const openSkillModal = () => {
    setSkillNameInput('')
    setSkillKind('general')
    setSkillModalOpen(true)
  }

  const closeSkillModal = () => {
    setSkillModalOpen(false)
    setSkillNameInput('')
  }

  const handleAddSkillSubmit = (e: FormEvent) => {
    e.preventDefault()
    const raw = skillNameInput.trim()
    if (!raw) return

    const norm = (s: string) => s.trim().toLowerCase()
    const exists =
      generalSkills.some((s) => norm(s) === norm(raw)) ||
      majorSkills.some((s) => norm(s) === norm(raw))
    if (exists) {
      closeSkillModal()
      return
    }

    if (skillKind === 'general') {
      setAddedGeneralSkills((prev) => [...prev, raw])
    } else {
      setAddedMajorSkills((prev) => [...prev, raw])
    }
    closeSkillModal()
  }

  const completeness = Math.min(
    20 +
      (user?.university ? 15 : 0) +
      (user?.major ? 15 : 0) +
      (allSkills.length > 0 ? 20 : 0) +
      (user?.gpa ? 10 : 0) +
      (user?.profilePic ? 20 : 0),
    100,
  )

  const PROFILE_TASKS: ProfileTask[] = [
      { id: "1", label: "Add a profile picture", done: !!user?.profilePic, link: "/edit-profile#basic" },
      { id: "2", label: "Add general skills", done: generalSkills.length > 0, link: "/edit-profile#skills" },
      { id: "3", label: "Add major skills", done: majorSkills.length > 0, link: "/edit-profile#skills" },
      { id: "4", label: "Complete academic info", done: !!user?.major && !!user?.university, link: "/edit-profile#basic" },
      { id: "5", label: "Add preferred project topics", done: false, link: "/edit-profile#work" },
  ]

  const nextActions = PROFILE_TASKS.filter((t) => !t.done).slice(0, 3)

  const handleMessage = () => {
    if (!user?.userId || user.userId <= 0) return
    navigate(`/messages?userId=${user.userId}`)
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(155deg,#f8f7ff,#f0f4ff,#faf5ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' as const }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Loading profile...</p>
        </div>
      </div>
    )
  if (error || !user) {
    return (
      <div style={S.page}>
        <div style={S.topBar}>
          <div style={S.topBarInner}>
            <button
              type="button"
              onClick={() => (isPublic ? navigate(-1) : navigateHome(navigate))}
              style={S.backBtn}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          </div>
        </div>
        <div style={{ ...S.content, minHeight: 280, display: "grid", placeItems: "center" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#b91c1c" }}>
            {error || "Profile not found."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.blob1} />
      <div style={S.blob2} />

      <div style={S.topBar}>
        <div style={S.topBarInner}>
          <button type="button" onClick={() => (isPublic ? navigate(-1) : navigateHome(navigate))} style={S.backBtn}>
            <ArrowLeft size={16} />
            <span>{isPublic ? "Back" : "Back to Dashboard"}</span>
          </button>
        </div>
      </div>

      <div style={S.content}>
        {/* Header: avatar + name + badges + edit (one horizontal band) */}
        <ProfileHeader user={user} mode={mode} onMessage={handleMessage} />

        {isPublic ? (
          <div style={S.card}>
            <div style={S.tabsRow}>
              <button type="button" onClick={() => setActiveTab("about")} style={{ ...S.tabBtn, ...(activeTab === "about" ? S.tabBtnActive : {}) }}>About</button>
              <button type="button" onClick={() => setActiveTab("skills")} style={{ ...S.tabBtn, ...(activeTab === "skills" ? S.tabBtnActive : {}) }}>Skills</button>
              <button type="button" onClick={() => setActiveTab("projects")} style={{ ...S.tabBtn, ...(activeTab === "projects" ? S.tabBtnActive : {}) }}>Projects</button>
            </div>
            {activeTab === "about" && <AcademicInfoSection user={user} />}
            {activeTab === "skills" && (
              <SkillsSection
                mode={mode}
                allSkills={allSkills}
                generalSkills={generalSkills}
                majorSkills={majorSkills}
                openSkillModal={openSkillModal}
              />
            )}
            {activeTab === "projects" && (
              <div style={S.card}>
                <div style={S.sectionHeader}>
                  <BookOpen size={14} color="#6366f1" />
                  <h2 style={S.sectionTitle}>Projects</h2>
                </div>
                {publicProjects.length === 0 ? (
                  <p style={S.quickIntro}>No projects found.</p>
                ) : (
                  <div style={S.quickList}>
                    {publicProjects.map((project) => (
                      <div key={`pp-${project.id}`} style={S.quickRow}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13 }}>{project.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                            {project.abstract || "No abstract provided."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
        <div className="profile-main-grid">
          <div style={S.col}>
            <AcademicInfoSection user={user} />
            <SkillsSection
              mode={mode}
              allSkills={allSkills}
              generalSkills={generalSkills}
              majorSkills={majorSkills}
              openSkillModal={openSkillModal}
            />
          </div>

          <div style={S.col}>
            {!isPublic && (
              <>
                <div style={S.card}>
                  <div style={S.sectionHeader}>
                    <CheckCircle2 size={14} color="#6366f1" />
                    <h2 style={S.sectionTitle}>Profile Completeness</h2>
                  </div>

                  <div style={S.progressRow}>
                    <div style={S.progressTrack}>
                      <div style={{ ...S.progressFill, width: `${completeness}%` }} />
                    </div>
                    <span style={S.progressPct}>{completeness}%</span>
                  </div>
                  <p style={S.progressHint}>
                    {completeness >= 80
                      ? "Strong profile — you're ready to match."
                      : "Complete your profile for better AI matches."}
                  </p>

                  {nextActions.length > 0 ? (
                    <div style={S.nextActions}>
                      {nextActions.map((task) => (
                        <div key={task.id} style={S.taskRow}>
                          <Circle size={14} color="#cbd5e1" style={{ flexShrink: 0 }} />
                          <span style={S.taskLabel}>{task.label}</span>
                          <Link to={task.link} style={S.doItLink}>
                            Do it →
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={S.allDoneHint}>You're on track — no urgent tasks.</p>
                  )}
                </div>

                <div style={S.card}>
                  <div style={S.sectionHeader}>
                    <Sparkles size={14} color="#6366f1" />
                    <h2 style={S.sectionTitle}>Next Steps</h2>
                  </div>
                  <p style={S.quickIntro}>Suggestions to get the most from the platform.</p>
                  <div style={S.quickList}>
                    <Link to="/students" style={S.quickRow}>
                      <Users size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                      <span>Browse students & find teammates</span>
                    </Link>
                    <Link to="/edit-profile" style={S.quickRow}>
                      <Pencil size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                      <span>Update your profile details</span>
                    </Link>
                    <button type="button" onClick={() => navigateHome(navigate)} style={S.quickRowBtn}>
                      <LayoutDashboard size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                      <span>Return to dashboard</span>
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
        )}
      </div>

      {!isPublic && skillModalOpen && (
        <div style={S.modalOverlay} onClick={closeSkillModal} role="presentation">
          <div
            style={S.modalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-skill-title"
          >
            <div style={S.modalHead}>
              <h2 id="add-skill-title" style={S.modalTitle}>
                Add skill
              </h2>
              <button type="button" style={S.modalClose} onClick={closeSkillModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSkillSubmit}>
              <label style={S.modalLabel}>
                Skill name
                <input
                  type="text"
                  value={skillNameInput}
                  onChange={(e) => setSkillNameInput(e.target.value)}
                  placeholder="e.g. React, Teamwork"
                  style={S.modalInput}
                  autoFocus
                  autoComplete="off"
                />
              </label>
              <p style={S.modalSub}>Type</p>
              <div style={S.kindToggle}>
                <button
                  type="button"
                  onClick={() => setSkillKind('general')}
                  style={{
                    ...S.kindBtn,
                    ...(skillKind === 'general' ? S.kindBtnActiveGeneral : {}),
                  }}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setSkillKind('major')}
                  style={{
                    ...S.kindBtn,
                    ...(skillKind === 'major' ? S.kindBtnActiveMajor : {}),
                  }}
                >
                  Major
                </button>
              </div>
              <div style={S.modalActions}>
                <button type="button" onClick={closeSkillModal} style={S.modalBtnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={S.modalBtnPrimary} disabled={!skillNameInput.trim()}>
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        a { text-decoration: none; }
        button:hover { opacity: 0.88; }
        .profile-academic-row:not(:last-child) {
          border-bottom: 1px solid #f1f5f9;
        }
        .profile-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .profile-main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function ProfileHeader({ user, mode, onMessage }: { user: StudentProfile; mode: ProfileMode; onMessage: () => void }) {
  return (
    <div style={S.heroCard}>
      <div style={S.avatarWrap}>
        {user.profilePic ? (
          <img src={user.profilePic} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        ) : (
          <div style={S.avatarFallback}>
            {user.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2) || "ST"}
          </div>
        )}
      </div>

      <div style={S.heroTextBlock}>
        <h1 style={S.heroName}>{user.name || "Student"}</h1>
        <p style={S.heroEmail}>{user.email}</p>
        <div style={S.heroBadges}>
          {user.major && (
            <span style={S.badge}>
              <GraduationCap size={12} /> {user.major}
            </span>
          )}
          {user.university && (
            <span style={{ ...S.badge, background: "#faf5ff", border: "1px solid #e9d5ff", color: "#7c3aed" }}>
              <MapPin size={12} /> {user.university}
            </span>
          )}
          {user.academicYear && (
            <span style={{ ...S.badge, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
              <Star size={12} /> {user.academicYear}
            </span>
          )}
        </div>
      </div>

      {mode === "public" ? (
        <button type="button" onClick={onMessage} style={S.heroEditBtn}>
          <span>Message</span>
        </button>
      ) : (
        <Link to="/edit-profile" style={S.heroEditBtn}>
          <Pencil size={15} />
          <span>Edit</span>
        </Link>
      )}
    </div>
  )
}

function AcademicInfoSection({ user }: { user: StudentProfile }) {
  return (
    <div style={S.card}>
      <div style={S.sectionHeader}>
        <BookOpen size={14} color="#6366f1" />
        <h2 style={S.sectionTitle}>Academic Info</h2>
      </div>
      <div style={S.infoList}>
        {[
          { label: "Email", value: user.email },
          { label: "Faculty", value: user.faculty },
          { label: "Year", value: user.academicYear },
          { label: "GPA", value: user.gpa },
        ].map((item) => (
          <div key={item.label} className="profile-academic-row" style={S.infoRow}>
            <span style={S.infoLabel}>{item.label}</span>
            <span style={{ ...S.infoValue, color: item.value ? "#0f172a" : "#cbd5e1" }}>{item.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsSection({
  mode,
  allSkills,
  generalSkills,
  majorSkills,
  openSkillModal,
}: {
  mode: ProfileMode
  allSkills: string[]
  generalSkills: string[]
  majorSkills: string[]
  openSkillModal: () => void
}) {
  const isPublic = mode === "public"
  return (
    <div style={S.card}>
      <div style={S.sectionHeader}>
        <Zap size={14} color="#a855f7" />
        <h2 style={S.sectionTitle}>Skills</h2>
        {!isPublic && (
          <button type="button" onClick={openSkillModal} style={S.inlineAddBtn}>
            + Add skills
          </button>
        )}
      </div>

      {allSkills.length === 0 ? (
        <div style={S.emptySkills}>
          <span style={{ fontSize: 22 }}>🧩</span>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>No skills yet</p>
          {!isPublic && (
            <button type="button" onClick={openSkillModal} style={S.addSkillsBtn}>
              Add skills →
            </button>
          )}
        </div>
      ) : (
        <div style={S.skillsInline}>
          {generalSkills.map((s, i) => (
            <span key={`g-${s}-${i}`} style={S.skillChip}>
              {s}
            </span>
          ))}
          {majorSkills.map((s, i) => (
            <span key={`m-${s}-${i}`} style={S.skillChipMajor}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 45%,#faf5ff 100%)',
    fontFamily: 'DM Sans, sans-serif',
    color: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'fixed',
    top: -160,
    right: -160,
    width: 520,
    height: 520,
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  blob2: {
    position: 'fixed',
    bottom: -120,
    left: -120,
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(248,247,255,0.88)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(99,102,241,0.1)',
  },
  topBarInner: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '0 20px',
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    fontFamily: 'inherit',
    padding: 0,
  },

  content: { maxWidth: 1000, margin: '0 auto', padding: '20px 20px 40px', position: 'relative', zIndex: 1 },

  heroCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    background: 'white',
    borderRadius: 16,
    border: '1px solid rgba(99,102,241,0.12)',
    boxShadow: '0 2px 16px rgba(99,102,241,0.06)',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 0 0 3px #eef2ff, 0 2px 12px rgba(99,102,241,0.18)',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg,#6366f1,#a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 800,
    color: 'white',
  },
  heroTextBlock: { flex: 1, minWidth: 200 },
  heroName: {
    margin: '0 0 2px',
    fontSize: 20,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.3px',
    fontFamily: 'Syne, sans-serif',
  },
  heroEmail: { margin: '0 0 8px', fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  heroBadges: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 600,
    color: '#6366f1',
  },
  heroEditBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'linear-gradient(135deg,#6366f1,#a855f7)',
    color: 'white',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    marginLeft: 'auto',
    boxShadow: '0 2px 10px rgba(99,102,241,0.25)',
  },

  col: { display: 'flex', flexDirection: 'column' as const, gap: 16 },

  card: {
    background: 'white',
    borderRadius: 14,
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 8px rgba(99,102,241,0.04)',
  },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  tabsRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 6,
    marginBottom: 12,
    borderBottom: "1px solid #e2e8f0",
  },
  tabBtn: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  tabBtnActive: {
    background: "#eef2ff",
    color: "#4f46e5",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  inlineAddBtn: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#6366f1',
    fontWeight: 700,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
  },

  infoList: { display: 'flex', flexDirection: 'column' as const },
  infoRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    padding: '8px 0',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'right' as const,
    wordBreak: 'break-word' as const,
    minWidth: 0,
  },

  emptySkills: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 0 4px',
    textAlign: 'center',
  },
  addSkillsBtn: {
    padding: '5px 12px',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 700,
    color: '#6366f1',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  skillsInline: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    padding: '4px 10px',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 600,
    color: '#6366f1',
  },
  skillChipMajor: {
    padding: '4px 10px',
    background: '#faf5ff',
    border: '1px solid #e9d5ff',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 600,
    color: '#7c3aed',
  },

  progressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  progressTrack: {
    flex: 1,
    height: 6,
    background: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg,#6366f1,#a855f7)',
    borderRadius: 4,
    transition: 'width 0.6s ease',
  },
  progressPct: { fontSize: 14, fontWeight: 800, color: '#6366f1', minWidth: 36 },
  progressHint: { margin: '0 0 10px', fontSize: 11, color: '#94a3b8', lineHeight: 1.4 },
  nextActions: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  taskRow: { display: 'flex', alignItems: 'center', gap: 8 },
  taskLabel: { flex: 1, fontSize: 12, color: '#475569', fontWeight: 500 },
  doItLink: { fontSize: 11, fontWeight: 700, color: '#6366f1', whiteSpace: 'nowrap' },
  allDoneHint: { margin: 0, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },

  quickIntro: { margin: '0 0 10px', fontSize: 11, color: '#94a3b8', lineHeight: 1.45 },
  quickList: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  quickRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: 12,
    fontWeight: 600,
    color: '#334155',
    transition: 'border-color 0.15s, background 0.15s',
  },
  quickRowBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: 12,
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    width: '100%',
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    padding: 16,
    backdropFilter: 'blur(4px)',
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    background: 'white',
    borderRadius: 14,
    padding: '18px 20px 20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
  },
  modalHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
    fontFamily: 'Syne, sans-serif',
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  modalLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 14,
  },
  modalSub: {
    margin: '0 0 8px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  modalInput: {
    width: '100%',
    marginTop: 6,
    padding: '9px 11px',
    borderRadius: 9,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    color: '#0f172a',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#fafafa',
  },
  kindToggle: { display: 'flex', gap: 8, marginBottom: 18 },
  kindBtn: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 9,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  kindBtnActiveGeneral: {
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    color: '#4f46e5',
  },
  kindBtnActiveMajor: {
    background: '#faf5ff',
    border: '1px solid #e9d5ff',
    color: '#7c3aed',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalBtnSecondary: {
    padding: '8px 14px',
    borderRadius: 9,
    border: '1px solid #e2e8f0',
    background: 'white',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  modalBtnPrimary: {
    padding: '8px 16px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg,#6366f1,#a855f7)',
    fontSize: 12,
    fontWeight: 700,
    color: 'white',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(99,102,241,0.25)',
  },
}
