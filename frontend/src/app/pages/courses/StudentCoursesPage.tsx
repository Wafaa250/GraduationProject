import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, FolderKanban, Inbox, Layers, Sparkles, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
    getCourseById,
    getCourseStudents,
    getEnrolledCourses,
    normalizeCourseProjectsFromDetail,
    type CourseDetails,
    type CourseProjectSummary,
    type CourseStudent,
    type EnrolledCourse,
} from "../../../api/studentCoursesApi";
import { getCourseId } from "../../../utils/normalize";

function asText(value: unknown, fallback = "—"): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getStudentProfileIdFromUser(user: unknown): number | null {
    const obj = user as { studentProfileId?: unknown; StudentProfileId?: unknown };
    const raw = obj.studentProfileId ?? obj.StudentProfileId;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function getCourseStudentProfileId(student: CourseStudent): number | null {
    const row = student as CourseStudent & { id?: number; Id?: number };
    const raw = row.studentId ?? row.StudentId ?? row.id ?? row.Id;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function formatSectionSchedule(days: string[] | undefined, from?: string | null, to?: string | null): string {
    const dayPart = Array.isArray(days) && days.length > 0 ? days.join(", ") : "Schedule not specified";
    if (!from || !to) return dayPart;
    return `${dayPart} · ${from} - ${to}`;
}

type CourseBundle = {
    detail: CourseDetails;
    roster: CourseStudent[];
};

type CourseTab = "section" | "chat" | "projects";
type ChatMessage = { text: string; senderId: number | null; time: number };

export default function StudentCoursesPage() {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId?: string }>();
    const routeCourseId = courseId && /^\d+$/.test(courseId) ? Number(courseId) : null;

    const [user, setUser] = useState<unknown>(null);
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState<string | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(routeCourseId);
    const [activeTab, setActiveTab] = useState<CourseTab>("section");
    const [showSectionStudents, setShowSectionStudents] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [showMembers, setShowMembers] = useState(false);
    const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null);
    const chatBottomRef = useRef<HTMLDivElement | null>(null);

    const [bundle, setBundle] = useState<CourseBundle | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setCoursesLoading(true);
            setCoursesError(null);
            try {
                const [meRes, enrolled] = await Promise.all([api.get("/me"), getEnrolledCourses()]);
                if (cancelled) return;
                setUser(meRes.data);
                setCourses(enrolled);
            } catch (err) {
                if (cancelled) return;
                console.error("Failed to load student courses page data", err);
                setCoursesError(parseApiErrorMessage(err));
            } finally {
                if (!cancelled) setCoursesLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setSelectedCourseId(routeCourseId);
    }, [routeCourseId]);

    useEffect(() => {
        if (selectedCourseId == null) {
            setBundle(null);
            setDetailsError(null);
            return;
        }
        let cancelled = false;
        const loadDetail = async () => {
            setDetailsLoading(true);
            setDetailsError(null);
            try {
                const [detail, roster] = await Promise.all([
                    getCourseById(selectedCourseId),
                    getCourseStudents(selectedCourseId),
                ]);
                if (cancelled) return;
                setBundle({ detail, roster });
            } catch (err) {
                if (cancelled) return;
                console.error(`Failed loading student course details for course ${selectedCourseId}`, err);
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 404) {
                    setDetailsError("This course is no longer available.");
                } else if (status === 403) {
                    setDetailsError("You do not have permission to view this course.");
                } else {
                    setDetailsError("We could not load this course right now. Please try again.");
                }
                setBundle(null);
            } finally {
                if (!cancelled) setDetailsLoading(false);
            }
        };
        void loadDetail();
        return () => {
            cancelled = true;
        };
    }, [selectedCourseId]);

    const myStudent = useMemo(() => {
        if (!bundle) return null;
        const studentProfileId = getStudentProfileIdFromUser(user);
        if (studentProfileId == null) return null;
        return (
            bundle.roster.find((student) => getCourseStudentProfileId(student) === studentProfileId) ?? null
        );
    }, [bundle, user]);

    const mySectionId = useMemo(() => {
        if (!myStudent) return null;
        return myStudent.sectionId ?? myStudent.SectionId ?? null;
    }, [myStudent]);

    useEffect(() => {
        console.log("user:", user);
        console.log("courseStudents:", bundle?.roster ?? []);
        console.log("myStudent:", myStudent);
        console.log("mySection:", mySectionId);
    }, [user, bundle, myStudent, mySectionId]);

    const mySection = useMemo(() => {
        if (!bundle || mySectionId == null) return null;
        const sections = bundle.detail.sections ?? [];
        return sections.find((section) => section.id === mySectionId) ?? null;
    }, [bundle, mySectionId]);

    const courseProjects = useMemo((): CourseProjectSummary[] => {
        if (!bundle) return [];
        return normalizeCourseProjectsFromDetail(bundle.detail);
    }, [bundle]);

    const courseStudents = useMemo((): CourseStudent[] => {
        return bundle?.roster ?? [];
    }, [bundle]);

    const mySectionProjects = useMemo((): CourseProjectSummary[] => {
        if (!bundle) return [];
        // Fallback: when section is missing, show available course projects.
        if (mySectionId == null) return courseProjects;
        const projects = courseProjects;
        return projects.filter(
            (project) =>
                project.applyToAllSections ||
                project.sections.some((sectionRef) => sectionRef.sectionId === mySectionId),
        );
    }, [bundle, mySectionId, courseProjects]);

    const mySectionStudents = useMemo(() => {
        if (!bundle) return [];
        // Fallback: when section is missing, render all course students.
        if (mySectionId == null) return courseStudents;
        return courseStudents.filter((student) => {
            const sid = student.sectionId ?? student.SectionId ?? null;
            return sid === mySectionId;
        });
    }, [bundle, mySectionId, courseStudents]);

    const authUserId = useMemo(() => {
        const raw = (user as { id?: unknown; Id?: unknown } | null)?.id ??
            (user as { id?: unknown; Id?: unknown } | null)?.Id;
        return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    }, [user]);

    const handleSelectCourse = (courseIdValue: number) => {
        if (selectedCourseId === courseIdValue) {
            setSelectedCourseId(null);
            setActiveTab("section");
            setShowSectionStudents(false);
            setMessages([]);
            setInput("");
            setShowMembers(false);
            navigate("/student/courses");
            return;
        }
        if (selectedCourseId !== courseIdValue) {
            setSelectedCourseId(courseIdValue);
            setActiveTab("section");
            setShowSectionStudents(false);
            setMessages([]);
            setInput("");
            setShowMembers(false);
            navigate(`/student/courses/${courseIdValue}`);
        }
    };

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;
        setMessages((prev) => [...prev, { text, senderId: authUserId, time: Date.now() }]);
        setInput("");
    };

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    useEffect(() => {
        console.log("courseStudents:", courseStudents);
        console.log("courseProjects:", courseProjects);
    }, [courseStudents, courseProjects]);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                color: "#0f172a",
                fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                padding: "24px 28px 40px",
            }}
        >
            <div style={{ maxWidth: 1080, margin: "0 auto" }}>
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </button>

                <header style={S.headerCard}>
                    <h1 style={S.title}>My Courses</h1>
                    <p style={S.subtitle}>
                        Open a course to view your section and section-specific projects.
                    </p>
                </header>

                {coursesLoading ? <p style={S.note}>Loading enrolled courses...</p> : null}
                {coursesError ? <p style={S.error}>{coursesError}</p> : null}

                {!coursesLoading && !coursesError ? (
                    <div style={S.layout}>
                        <aside style={S.sidebarCard}>
                            <h2 style={S.sectionTitle}>Enrolled Courses</h2>
                            {courses.length === 0 ? (
                                <div style={S.emptyState}>
                                    <Inbox size={20} color="#94a3b8" />
                                    <p style={S.emptyTitle}>No enrolled courses yet</p>
                                    <p style={S.emptyText}>Once you enroll in courses, they will appear here.</p>
                                </div>
                            ) : (
                                <div style={S.sidebarList}>
                                    {courses.map((course) => {
                                        const cid = getCourseId(course);
                                        if (cid == null) return null;
                                        const active = selectedCourseId === cid;
                                        const hovered = hoveredCourseId === cid;
                                        return (
                                            <div
                                                key={cid}
                                                onMouseEnter={() => setHoveredCourseId(cid)}
                                                onMouseLeave={() => setHoveredCourseId((prev) => (prev === cid ? null : prev))}
                                                style={{
                                                    ...S.sidebarCourseBtn,
                                                    borderColor: active ? "#c4b5fd" : "#e5e7eb",
                                                    background: active ? "#ede9fe" : hovered ? "#f3f4f6" : "#fff",
                                                    boxShadow: active
                                                        ? "0 8px 20px rgba(99,102,241,0.16)"
                                                        : hovered
                                                            ? "0 6px 16px rgba(15,23,42,0.08)"
                                                            : "0 2px 6px rgba(15,23,42,0.04)",
                                                    borderLeft: active ? "4px solid #7c3aed" : "4px solid transparent",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectCourse(cid)}
                                                    style={S.sidebarCourseTrigger}
                                                >
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={S.courseName}>
                                                            <BookOpen size={14} color="#7c3aed" />
                                                            {asText(course.name)}
                                                        </p>
                                                        <p style={S.sidebarCode}>{asText(course.code)}</p>
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </aside>

                        <section style={S.contentCard}>
                            {selectedCourseId == null ? (
                                <div style={S.emptyState}>
                                    <Inbox size={22} color="#94a3b8" />
                                    <p style={S.emptyTitle}>Choose a course</p>
                                    <p style={S.emptyText}>Select a course from the sidebar to view details.</p>
                                </div>
                            ) : detailsLoading ? (
                                <p style={S.note}>Loading course details...</p>
                            ) : detailsError ? (
                                <p style={S.error}>{detailsError}</p>
                            ) : bundle ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <article style={S.headerPanel}>
                                        <h3 style={S.innerTitle}>
                                            <BookOpen size={16} />
                                            {asText(bundle.detail.name)}
                                        </h3>
                                        <p style={S.courseCodeLine}>
                                            Code: <strong>{asText(bundle.detail.code)}</strong>
                                        </p>
                                        <div style={S.metaTags}>
                                            {bundle.detail.semester ? (
                                                <span style={S.metaBadge}>Semester: {bundle.detail.semester}</span>
                                            ) : null}
                                            {bundle.detail.doctorName ? (
                                                <span style={S.metaBadge}>Doctor: {bundle.detail.doctorName}</span>
                                            ) : null}
                                        </div>
                                    </article>

                                    <div style={S.tabsRow}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("section")}
                                            style={tabStyle(activeTab === "section")}
                                        >
                                            My Section
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("chat")}
                                            style={tabStyle(activeTab === "chat")}
                                        >
                                            Chat
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("projects")}
                                            style={tabStyle(activeTab === "projects")}
                                        >
                                            Projects
                                        </button>
                                    </div>

                                    <article style={S.innerCard}>
                                        {activeTab === "section" ? (
                                            <>
                                                <h3 style={S.innerTitle}>
                                                    <Layers size={16} />
                                                    My Section
                                                </h3>
                                                {mySection ? (
                                                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
                                                        <div style={S.subCard}>
                                                            <p style={S.subCardTitle}>Section Info</p>
                                                            <p style={S.courseMetaLine}>
                                                                <strong>{asText(mySection.name)}</strong>
                                                            </p>
                                                            <p style={S.courseMetaLine}>
                                                                {formatSectionSchedule(
                                                                    mySection.days,
                                                                    mySection.timeFrom,
                                                                    mySection.timeTo,
                                                                )}
                                                            </p>
                                                            <p style={S.courseMetaLine}>
                                                                Capacity: <strong>{mySection.capacity}</strong>
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            style={S.aiActionBtn}
                                                            onClick={() =>
                                                                setShowSectionStudents((prev) => !prev)
                                                            }
                                                        >
                                                            <Users size={14} />
                                                            {showSectionStudents
                                                                ? "Hide Students in My Section"
                                                                : "Show Students in My Section"}
                                                        </button>
                                                        <div
                                                            style={{
                                                                maxHeight: showSectionStudents ? 480 : 0,
                                                                opacity: showSectionStudents ? 1 : 0,
                                                                overflow: "hidden",
                                                                transition: "max-height 0.24s ease, opacity 0.18s ease",
                                                            }}
                                                        >
                                                            <div style={S.subCard}>
                                                                <p style={S.subCardTitle}>Students In My Section</p>
                                                                {mySectionStudents.length === 0 ? (
                                                                    <div style={S.emptyState}>
                                                                        <Users size={20} color="#94a3b8" />
                                                                        <p style={S.emptyTitle}>
                                                                            No students found in your section.
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div style={S.list}>
                                                                        {mySectionStudents.map((student, index) => {
                                                                            const studentName = asText(
                                                                                student.name ?? student.Name,
                                                                                "Student",
                                                                            );
                                                                            const emailRaw = student.email ?? student.Email;
                                                                            const email =
                                                                                typeof emailRaw === "string" &&
                                                                                emailRaw.trim()
                                                                                    ? emailRaw.trim()
                                                                                    : null;
                                                                            return (
                                                                                <div
                                                                                    key={`${studentName}-${index}-my-section`}
                                                                                    style={S.studentRow}
                                                                                >
                                                                                    <div style={S.studentAvatar}>
                                                                                        {studentName.charAt(0).toUpperCase()}
                                                                                    </div>
                                                                                    <div style={{ minWidth: 0 }}>
                                                                                        <p style={S.studentName}>
                                                                                            {studentName}
                                                                                        </p>
                                                                                        {email ? (
                                                                                            <p style={S.studentEmail}>
                                                                                                {email}
                                                                                            </p>
                                                                                        ) : null}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
                                                        <div style={S.subCard}>
                                                            <p style={S.subCardTitle}>Section Info</p>
                                                            <p style={S.note}>
                                                                You are not assigned yet, but here are course students.
                                                            </p>
                                                        </div>
                                                        <div style={S.subCard}>
                                                            <p style={S.subCardTitle}>Course Students</p>
                                                            {courseStudents.length === 0 ? (
                                                                <div style={S.emptyState}>
                                                                    <Users size={20} color="#94a3b8" />
                                                                    <p style={S.emptyTitle}>No students found for this course.</p>
                                                                </div>
                                                            ) : (
                                                                <div style={S.list}>
                                                                    {courseStudents.map((student, index) => {
                                                                        const studentName = asText(
                                                                            student.name ?? student.Name,
                                                                            "Student",
                                                                        );
                                                                        const emailRaw = student.email ?? student.Email;
                                                                        const email =
                                                                            typeof emailRaw === "string" && emailRaw.trim()
                                                                                ? emailRaw.trim()
                                                                                : null;
                                                                        return (
                                                                            <div
                                                                                key={`${studentName}-${index}-course`}
                                                                                style={S.studentRow}
                                                                            >
                                                                                <div style={S.studentAvatar}>
                                                                                    {studentName.charAt(0).toUpperCase()}
                                                                                </div>
                                                                                <div style={{ minWidth: 0 }}>
                                                                                    <p style={S.studentName}>{studentName}</p>
                                                                                    {email ? <p style={S.studentEmail}>{email}</p> : null}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : null}

                                        {activeTab === "chat" ? (
                                            <>
                                                <h3 style={S.innerTitle}>
                                                    <Users size={16} />
                                                    Chat
                                                </h3>
                                                <section style={S.chatMainPanel}>
                                                    <div style={S.chatHeader}>
                                                        <p style={S.chatHeaderTitle}>Section Chat</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowMembers(true)}
                                                            style={S.chatMembersBtn}
                                                        >
                                                            Members
                                                        </button>
                                                    </div>
                                                    <div style={S.chatMessages}>
                                                        {messages.length === 0 ? (
                                                            <div style={S.emptyState}>
                                                                <Inbox size={20} color="#94a3b8" />
                                                                <p style={S.emptyTitle}>
                                                                    Start chatting with your section 👋
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            messages.map((msg) => {
                                                                const mine =
                                                                    authUserId != null &&
                                                                    msg.senderId === authUserId;
                                                                return (
                                                                    <div
                                                                        key={`${msg.time}-${msg.text}`}
                                                                        style={{
                                                                            ...S.chatRow,
                                                                            justifyContent: mine
                                                                                ? "flex-end"
                                                                                : "flex-start",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                ...S.chatBubble,
                                                                                ...(mine
                                                                                    ? S.chatBubbleMine
                                                                                    : S.chatBubbleOther),
                                                                            }}
                                                                        >
                                                                            <p style={S.chatText}>{msg.text}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                        <div ref={chatBottomRef} />
                                                    </div>
                                                    <div style={S.chatInputRow}>
                                                        <input
                                                            type="text"
                                                            value={input}
                                                            onChange={(e) => setInput(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    sendMessage();
                                                                }
                                                            }}
                                                            placeholder="Type a message..."
                                                            style={S.chatInput}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={sendMessage}
                                                            style={S.chatSendBtn}
                                                        >
                                                            Send
                                                        </button>
                                                    </div>
                                                </section>
                                                {showMembers ? (
                                                    <div style={S.membersOverlay} onClick={() => setShowMembers(false)}>
                                                        <div style={S.membersModal} onClick={(e) => e.stopPropagation()}>
                                                            <div style={S.membersModalHeader}>
                                                                <p style={S.membersModalTitle}>Section Members</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowMembers(false)}
                                                                    style={S.membersCloseBtn}
                                                                >
                                                                    Close
                                                                </button>
                                                            </div>
                                                            {mySectionStudents.length === 0 ? (
                                                                <p style={S.chatMembersEmpty}>No members in your section.</p>
                                                            ) : (
                                                                <div style={S.chatMembersList}>
                                                                    {mySectionStudents.map((student, index) => {
                                                                        const studentName = asText(
                                                                            student.name ?? student.Name,
                                                                            "Student",
                                                                        );
                                                                        const studentProfileId =
                                                                            getCourseStudentProfileId(student);
                                                                        const isCurrentUser =
                                                                            studentProfileId != null &&
                                                                            studentProfileId === getStudentProfileIdFromUser(user);
                                                                        return (
                                                                            <div
                                                                                key={`chat-member-${studentProfileId ?? index}`}
                                                                                style={{
                                                                                    ...S.chatMemberRow,
                                                                                    ...(isCurrentUser
                                                                                        ? S.chatMemberRowActive
                                                                                        : {}),
                                                                                }}
                                                                            >
                                                                                <div style={S.studentAvatar}>
                                                                                    {studentName.charAt(0).toUpperCase()}
                                                                                </div>
                                                                                <p style={S.chatMemberName}>
                                                                                    {studentName}
                                                                                    {isCurrentUser ? " (You)" : ""}
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </>
                                        ) : null}

                                        {activeTab === "projects" ? (
                                            <>
                                                <div style={S.projectsHeaderRow}>
                                                    <h3 style={S.innerTitle}>
                                                        <FolderKanban size={16} />
                                                        Projects
                                                    </h3>
                                                </div>
                                                {mySectionProjects.length === 0 ? (
                                                    <div style={S.emptyState}>
                                                        <FolderKanban size={20} color="#94a3b8" />
                                                        <p style={S.emptyTitle}>
                                                            No projects have been posted by the doctor yet.
                                                        </p>
                                                    </div>
                                        ) : (
                                            <div style={S.list}>
                                                {mySectionProjects.map((project) => (
                                                    <div key={`api-${project.id}`} style={S.projectCard}>
                                                        <p style={S.projectTitle}>{project.title}</p>
                                                        <p style={S.courseMetaLine}>Team size: {project.teamSize}</p>
                                                        {project.description ? (
                                                            <p style={S.projectDesc}>{project.description}</p>
                                                        ) : null}
                                                        {(() => {
                                                            const modeRaw = (
                                                                project as { teamFormationMode?: string; TeamFormationMode?: string }
                                                            ).teamFormationMode ??
                                                                (
                                                                    project as {
                                                                        teamFormationMode?: string;
                                                                        TeamFormationMode?: string;
                                                                    }
                                                                ).TeamFormationMode ??
                                                                "SECTION";
                                                            const mode =
                                                                modeRaw === "AI" ||
                                                                modeRaw === "SECTION" ||
                                                                modeRaw === "COURSE"
                                                                    ? modeRaw
                                                                    : "SECTION";
                                                            const teamMembersRaw = (
                                                                project as {
                                                                    teamMembers?: Array<{ name?: string; Name?: string }>;
                                                                    TeamMembers?: Array<{ name?: string; Name?: string }>;
                                                                }
                                                            ).teamMembers ??
                                                                (
                                                                    project as {
                                                                        teamMembers?: Array<{ name?: string; Name?: string }>;
                                                                        TeamMembers?: Array<{ name?: string; Name?: string }>;
                                                                    }
                                                                ).TeamMembers ??
                                                                [];
                                                            const teamMembers = Array.isArray(teamMembersRaw)
                                                                ? teamMembersRaw
                                                                : [];

                                                            if (mode === "AI") {
                                                                return (
                                                                    <div style={S.projectModeBlock}>
                                                                        <span style={{ ...S.modeBadge, ...S.modeBadgeAi }}>
                                                                            <Sparkles size={13} />
                                                                            Doctor assigned teams
                                                                        </span>
                                                                        <p style={S.projectModeTitle}>My Team</p>
                                                                        {teamMembers.length > 0 ? (
                                                                            <div style={S.list}>
                                                                                {teamMembers.map((member, index) => {
                                                                                    const memberName = asText(
                                                                                        member.name ?? member.Name,
                                                                                        "Team member",
                                                                                    );
                                                                                    return (
                                                                                        <div
                                                                                            key={`${project.id}-member-${index}`}
                                                                                            style={S.teamMemberRow}
                                                                                        >
                                                                                            <div style={S.studentAvatar}>
                                                                                                {memberName
                                                                                                    .charAt(0)
                                                                                                    .toUpperCase()}
                                                                                            </div>
                                                                                            <p style={S.studentName}>{memberName}</p>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ) : (
                                                                            <p style={S.projectHintText}>
                                                                                Your team will be assigned automatically.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }

                                                            if (mode === "COURSE") {
                                                                return (
                                                                    <div style={S.projectModeBlock}>
                                                                        <span style={{ ...S.modeBadge, ...S.modeBadgeCourse }}>
                                                                            <Users size={13} />
                                                                            Choose from entire course
                                                                        </span>
                                                                        <button type="button" style={S.aiActionBtn}>
                                                                            <Users size={14} />
                                                                            Choose Teammates
                                                                        </button>
                                                                        <p style={S.projectHintText}>
                                                                            You can select students from any section in this
                                                                            course.
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div style={S.projectModeBlock}>
                                                                    <span style={{ ...S.modeBadge, ...S.modeBadgeSection }}>
                                                                        <Users size={13} />
                                                                        Choose from my section
                                                                    </span>
                                                                    <button type="button" style={S.aiActionBtn}>
                                                                        <Users size={14} />
                                                                        Choose Teammates
                                                                    </button>
                                                                    <p style={S.projectHintText}>
                                                                        You can only select students from your section.
                                                                    </p>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ))}
                                            </div>
                                                )}
                                            </>
                                        ) : null}
                                    </article>
                                </div>
                            ) : (
                                <p style={S.note}>Choose a course to view details.</p>
                            )}
                        </section>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

const S: Record<string, CSSProperties> = {
    backBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        background: "#fff",
        color: "#334155",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
    },
    headerCard: {
        marginTop: 20,
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: "20px 22px",
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "8px 0 0", fontSize: 13, color: "#6b7280" },
    layout: {
        marginTop: 20,
        display: "grid",
        gridTemplateColumns: "280px minmax(0, 1fr)",
        gap: 22,
    },
    sidebarCard: {
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: 18,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
        alignSelf: "start",
    },
    contentCard: {
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: 22,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    sectionTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: "#1f2937" },
    list: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
    sidebarList: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
    sidebarCourseBtn: {
        textAlign: "left",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fff",
        padding: "0",
        fontFamily: "inherit",
        transition: "background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease",
    },
    sidebarCourseTrigger: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        background: "transparent",
        border: "none",
        padding: "13px 14px",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
    },
    sidebarCode: { margin: "6px 0 0", fontSize: 11, color: "#7c3aed", fontWeight: 700 },
    courseName: { margin: 0, fontSize: 14, fontWeight: 800, color: "#1f2937", display: "flex", alignItems: "center", gap: 8 },
    courseMetaLine: { margin: "8px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.45 },
    courseCodeLine: { margin: "10px 0 0", fontSize: 13, color: "#4b5563", lineHeight: 1.45 },
    metaTags: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
    metaBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: 999,
        background: "#ede9fe",
        color: "#6d28d9",
        fontSize: 11,
        fontWeight: 700,
        border: "1px solid #ddd6fe",
    },
    note: { margin: "12px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.55 },
    error: { margin: "12px 0 0", fontSize: 13, color: "#b91c1c", lineHeight: 1.55, fontWeight: 600 },
    headerPanel: {
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        background: "linear-gradient(135deg,#ede9fe 0%,#ffffff 70%)",
        padding: "18px 20px",
        boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
    },
    tabsRow: {
        display: "flex",
        alignItems: "center",
        gap: 18,
        borderBottom: "1px solid #e5e7eb",
        padding: "0 4px",
    },
    innerCard: {
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fff",
        padding: 20,
        boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
    },
    innerTitle: {
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        fontWeight: 800,
        color: "#1f2937",
    },
    projectCard: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: "12px 14px",
        transition: "transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease",
        boxShadow: "0 3px 10px rgba(15,23,42,0.04)",
    },
    sectionGroupCard: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: "12px 14px",
        boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
    },
    sectionGroupHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 8,
    },
    sectionGroupTitle: {
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 800,
        color: "#1f2937",
    },
    sectionCountBadge: {
        fontSize: 11,
        fontWeight: 700,
        color: "#6d28d9",
        background: "#ede9fe",
        border: "1px solid #ddd6fe",
        borderRadius: 999,
        padding: "4px 8px",
    },
    projectTitle: {
        margin: 0,
        fontSize: 14,
        fontWeight: 800,
        color: "#1f2937",
    },
    studentRow: {
        borderBottom: "1px solid #e5e7eb",
        background: "transparent",
        padding: "12px 4px",
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    studentAvatar: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#ede9fe",
        color: "#7c3aed",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 800,
        flexShrink: 0,
    },
    studentName: {
        margin: 0,
        fontSize: 13,
        fontWeight: 700,
        color: "#1f2937",
    },
    studentEmail: { margin: "4px 0 0", fontSize: 12, color: "#6b7280" },
    projectDesc: { margin: "6px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
    projectModeBlock: {
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    modeBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        width: "fit-content",
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 999,
        padding: "5px 10px",
    },
    modeBadgeAi: {
        color: "#6d28d9",
        background: "#ede9fe",
        border: "1px solid #ddd6fe",
    },
    modeBadgeSection: {
        color: "#1d4ed8",
        background: "#dbeafe",
        border: "1px solid #bfdbfe",
    },
    modeBadgeCourse: {
        color: "#166534",
        background: "#dcfce7",
        border: "1px solid #bbf7d0",
    },
    projectModeTitle: {
        margin: 0,
        fontSize: 12,
        fontWeight: 800,
        color: "#374151",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
    },
    projectHintText: {
        margin: 0,
        fontSize: 12,
        color: "#6b7280",
        lineHeight: 1.45,
    },
    teamMemberRow: {
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: "#f8fafc",
        padding: "8px 10px",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    emptyState: {
        marginTop: 16,
        padding: "18px 14px",
        borderRadius: 12,
        background: "#f8fafc",
        border: "1px dashed #d1d5db",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 6,
    },
    emptyTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "#6b7280" },
    emptyText: { margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 },
    chatMembersBtn: {
        border: "1px solid #ddd6fe",
        background: "#f5f3ff",
        color: "#6d28d9",
        borderRadius: 9,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    chatMembersList: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflowY: "auto",
        minHeight: 0,
    },
    chatMembersEmpty: {
        margin: "6px 0 0",
        fontSize: 12,
        color: "#94a3b8",
    },
    chatMemberRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 10,
        padding: "7px 8px",
        background: "#f8fafc",
    },
    chatMemberRowActive: {
        background: "#ede9fe",
        border: "1px solid #ddd6fe",
    },
    chatMemberName: {
        margin: 0,
        fontSize: 12,
        fontWeight: 700,
        color: "#1f2937",
    },
    chatMainPanel: {
        marginTop: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: 380,
    },
    chatHeader: {
        padding: "10px 12px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fafafa",
    },
    chatHeaderTitle: {
        margin: 0,
        fontSize: 14,
        fontWeight: 800,
        color: "#1f2937",
    },
    chatHeaderSubTitle: {
        margin: "4px 0 0",
        fontSize: 12,
        color: "#6b7280",
    },
    chatMessages: {
        flex: 1,
        overflowY: "auto",
        padding: 10,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    chatRow: {
        display: "flex",
        width: "100%",
    },
    chatBubble: {
        maxWidth: "60%",
        borderRadius: 14,
        padding: "8px 11px",
    },
    chatBubbleMine: {
        background: "#7c3aed",
        color: "#fff",
        borderBottomRightRadius: 6,
    },
    chatBubbleOther: {
        background: "#eef2ff",
        color: "#1f2937",
        borderBottomLeftRadius: 6,
    },
    chatText: {
        margin: 0,
        fontSize: 13,
        lineHeight: 1.45,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },
    chatInputRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 10,
        borderTop: "1px solid #e5e7eb",
        background: "#fafafa",
    },
    membersOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        padding: 16,
    },
    membersModal: {
        width: "100%",
        maxWidth: 420,
        maxHeight: "70vh",
        overflow: "hidden",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#fff",
        boxShadow: "0 16px 42px rgba(15,23,42,0.25)",
        display: "flex",
        flexDirection: "column",
    },
    membersModalHeader: {
        padding: "12px 14px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    membersModalTitle: {
        margin: 0,
        fontSize: 14,
        fontWeight: 800,
        color: "#1f2937",
    },
    membersCloseBtn: {
        border: "1px solid #e5e7eb",
        background: "#fff",
        color: "#475569",
        borderRadius: 8,
        padding: "6px 9px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    chatInput: {
        flex: 1,
        border: "1px solid #d1d5db",
        borderRadius: 10,
        background: "#fff",
        padding: "10px 12px",
        fontSize: 13,
        color: "#1f2937",
        fontFamily: "inherit",
        outline: "none",
    },
    chatSendBtn: {
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        background: "#7c3aed",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    subCard: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: "12px 14px",
    },
    subCardTitle: {
        margin: 0,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "#6b7280",
    },
    aiActionBtn: {
        marginTop: 10,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #c4b5fd",
        background: "#ede9fe",
        color: "#6d28d9",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    manualSelectionLabel: {
        margin: "10px 0 0",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: "#6b7280",
    },
};

function tabStyle(active: boolean): CSSProperties {
    return {
        border: "none",
        borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
        background: "transparent",
        color: active ? "#7c3aed" : "#6b7280",
        fontSize: 13,
        fontWeight: active ? 800 : 700,
        padding: "10px 2px 9px",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "color 0.16s ease, border-color 0.16s ease",
    };
}
