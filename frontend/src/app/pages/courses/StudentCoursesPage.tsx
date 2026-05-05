import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, FolderKanban, Inbox, Layers, Sparkles, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
    getCourseById,
    getCourseStudents,
    getEnrolledCourses,
    type CourseDetails,
    type CourseStudent,
    type EnrolledCourse,
} from "../../../api/studentCoursesApi";
import ProfileLink from "../../components/common/ProfileLink";

// ── Project types (matches GET /api/courses/{courseId}/projects response) ──
type CourseProjectSection = { sectionId: number; sectionName: string };
type CourseProjectRaw = {
    // camelCase (when JsonNamingPolicy is set)
    id?: number; courseId?: number; title?: string; description?: string | null;
    teamSize?: number; applyToAllSections?: boolean; allowCrossSectionTeams?: boolean;
    aiMode?: string; createdAt?: string; sections?: CourseProjectSection[];
    // PascalCase (default ASP.NET without naming policy)
    Id?: number; CourseId?: number; Title?: string; Description?: string | null;
    TeamSize?: number; ApplyToAllSections?: boolean; AllowCrossSectionTeams?: boolean;
    AiMode?: string; CreatedAt?: string; Sections?: CourseProjectSection[];
};

type CourseProject = {
    id: number;
    courseId: number;
    title: string;
    description?: string | null;
    teamSize: number;
    applyToAllSections: boolean;
    allowCrossSectionTeams: boolean;
    aiMode: "doctor" | "student";
    createdAt: string;
    sections: CourseProjectSection[];
};

function normalizeCourseProject(raw: CourseProjectRaw): CourseProject {
    const aiModeRaw = (raw.aiMode ?? raw.AiMode ?? "doctor").toLowerCase().trim();
    return {
        id: raw.id ?? raw.Id ?? 0,
        courseId: raw.courseId ?? raw.CourseId ?? 0,
        title: raw.title ?? raw.Title ?? "",
        description: raw.description ?? raw.Description ?? null,
        teamSize: raw.teamSize ?? raw.TeamSize ?? 2,
        applyToAllSections: raw.applyToAllSections ?? raw.ApplyToAllSections ?? false,
        allowCrossSectionTeams: raw.allowCrossSectionTeams ?? raw.AllowCrossSectionTeams ?? false,
        aiMode: aiModeRaw === "student" ? "student" : "doctor",
        createdAt: raw.createdAt ?? raw.CreatedAt ?? "",
        sections: (raw.sections ?? raw.Sections ?? []).map(s => ({
            sectionId: (s as { sectionId?: number; SectionId?: number }).sectionId ?? (s as { sectionId?: number; SectionId?: number }).SectionId ?? 0,
            sectionName: (s as { sectionName?: string; SectionName?: string }).sectionName ?? (s as { sectionName?: string; SectionName?: string }).SectionName ?? "",
        })),
    };
}

import { getCourseId } from "../../../utils/normalize";

function asText(value: unknown, fallback = "—"): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getStudentProfileIdFromUser(user: unknown): number | null {
    // /api/me returns: { profileId, studentProfileId, ... }
    // Support all known casing variants to be safe
    const obj = user as {
        profileId?: unknown;
        ProfileId?: unknown;
        studentProfileId?: unknown;
        StudentProfileId?: unknown;
    };
    const raw =
        obj.profileId ??
        obj.ProfileId ??
        obj.studentProfileId ??
        obj.StudentProfileId;
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
type ChatMessage = {
    id: number;
    sectionId: number;
    senderUserId: number;
    senderName: string;
    text: string;
    sentAt: string; // ISO string
};

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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [chatSending, setChatSending] = useState(false);
    const [input, setInput] = useState("");
    const [showMembers, setShowMembers] = useState(false);
    const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null);
    const chatBottomRef = useRef<HTMLDivElement | null>(null);

    const [bundle, setBundle] = useState<CourseBundle | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [allProjects, setAllProjects] = useState<CourseProject[]>([]);

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
            setAllProjects([]);
            setDetailsError(null);
            return;
        }
        let cancelled = false;
        const loadDetail = async () => {
            setDetailsLoading(true);
            setDetailsError(null);
            try {
                const [detail, roster, projectsRes] = await Promise.all([
                    getCourseById(selectedCourseId),
                    getCourseStudents(selectedCourseId),
                    api.get<CourseProjectRaw[]>(`/courses/${selectedCourseId}/projects`),
                ]);
                if (cancelled) return;
                setBundle({ detail, roster });
                setAllProjects((projectsRes.data ?? []).map(normalizeCourseProject));
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


    const mySection = useMemo(() => {
        if (!bundle || mySectionId == null) return null;
        const sections = bundle.detail.sections ?? [];
        return sections.find((section) => section.id === mySectionId) ?? null;
    }, [bundle, mySectionId]);

    const courseStudents = useMemo((): CourseStudent[] => {
        return bundle?.roster ?? [];
    }, [bundle]);

    // Filter projects visible to this student's section
    const mySectionProjects = useMemo((): CourseProject[] => {
        if (allProjects.length === 0) return [];
        if (mySectionId == null) return allProjects.filter(p => p.applyToAllSections);
        return allProjects.filter(
            (p) =>
                p.applyToAllSections ||
                p.sections.some((s) => s.sectionId === mySectionId),
        );
    }, [allProjects, mySectionId]);

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
            setMessages([]);
            setChatError(null);
            setInput("");
            setShowMembers(false);
            navigate("/student/courses");
            return;
        }
        if (selectedCourseId !== courseIdValue) {
            setSelectedCourseId(courseIdValue);
            setActiveTab("section");
            setMessages([]);
            setChatError(null);
            setInput("");
            setShowMembers(false);
            navigate(`/student/courses/${courseIdValue}`);
        }
    };

    // ── Derive the current section id from the loaded bundle ────────────────
    const currentSectionId = useMemo(() => {
        if (!bundle) return null;
        // mySection is already resolved; get its id
        if (!myStudent) return null;
        return myStudent.sectionId ?? (myStudent as { SectionId?: number }).SectionId ?? null;
    }, [bundle, myStudent]);

    // ── Fetch messages for the active section ────────────────────────────────
    const fetchMessages = useCallback(async (sectionId: number) => {
        setChatLoading(true);
        setChatError(null);
        try {
            const res = await api.get<ChatMessage[]>(`/sections/${sectionId}/chat?limit=100`);
            setMessages(res.data);
        } catch (err) {
            setChatError(parseApiErrorMessage(err));
        } finally {
            setChatLoading(false);
        }
    }, []);

    // Load messages when switching to chat tab or when section changes
    useEffect(() => {
        if (activeTab === "chat" && currentSectionId != null) {
            void fetchMessages(currentSectionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, currentSectionId]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || !currentSectionId || chatSending) return;
        setInput("");
        setChatSending(true);
        try {
            const res = await api.post<ChatMessage>(`/sections/${currentSectionId}/chat`, { text });
            setMessages((prev) => [...prev, res.data]);
        } catch (err) {
            setChatError(parseApiErrorMessage(err));
            setInput(text); // restore so the user can retry
        } finally {
            setChatSending(false);
        }
    };

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);


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
                                                <span style={S.metaBadge}>
                                                    Doctor:{" "}
                                                    <ProfileLink userId={bundle.detail.doctorId} role="doctor">
                                                        {bundle.detail.doctorName}
                                                    </ProfileLink>
                                                </span>
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
                                                        <div style={S.subCard}>
                                                            <p style={S.subCardTitle}>Students in My Section ({mySectionStudents.length})</p>
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
                                                                                        <ProfileLink userId={student.userId ?? student.UserId} role="student" style={{ color: "#1f2937" }}>
                                                                                            {studentName}
                                                                                        </ProfileLink>
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
                                                                                    <p style={S.studentName}>
                                                                                        <ProfileLink userId={student.userId ?? student.UserId} role="student" style={{ color: "#1f2937" }}>
                                                                                            {studentName}
                                                                                        </ProfileLink>
                                                                                    </p>
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

                                                {currentSectionId == null ? (
                                                    <div style={S.emptyState}>
                                                        <Inbox size={20} color="#94a3b8" />
                                                        <p style={S.emptyTitle}>You need to be assigned to a section to use chat.</p>
                                                    </div>
                                                ) : (
                                                    <section style={S.chatMainPanel}>
                                                        <div style={S.chatHeader}>
                                                            <div style={S.chatHeaderLeft}>
                                                                <div style={S.chatGroupAvatar}>
                                                                    {(mySection?.name ?? "Section")
                                                                        .split(/\s+/)
                                                                        .filter(Boolean)
                                                                        .slice(0, 2)
                                                                        .map((part) => part[0]?.toUpperCase() ?? "")
                                                                        .join("")}
                                                                </div>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <p style={S.chatHeaderTitle}>
                                                                        {mySection?.name ?? "Section Chat"}
                                                                    </p>
                                                                    <p style={S.chatHeaderSubTitle}>
                                                                        {mySectionStudents.length} members
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                                                                {chatLoading && (
                                                                    <span style={{ fontSize: 11, color: "#94a3b8" }}>loading…</span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void fetchMessages(currentSectionId)}
                                                                    style={S.chatMembersBtn}
                                                                    title="Refresh messages"
                                                                >
                                                                    ↻
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowMembers((prev) => !prev)}
                                                                    style={S.chatMembersBtn}
                                                                >
                                                                    Members
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                ...S.chatBody,
                                                                gridTemplateColumns: showMembers
                                                                    ? "minmax(0,1fr) 250px"
                                                                    : "minmax(0,1fr)",
                                                            }}
                                                        >
                                                            <div style={S.chatConversationCol}>
                                                                <div style={S.chatMessages}>
                                                                    {chatError ? (
                                                                        <p style={{ ...S.error, padding: "8px 12px" }}>{chatError}</p>
                                                                    ) : messages.length === 0 && !chatLoading ? (
                                                                        <div style={S.emptyState}>
                                                                            <Inbox size={20} color="#94a3b8" />
                                                                            <p style={S.emptyTitle}>
                                                                                Start chatting with your section 👋
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        messages.map((msg) => {
                                                                            const mine = msg.senderUserId === authUserId;
                                                                            return (
                                                                                <div
                                                                                    key={msg.id}
                                                                                    style={{
                                                                                        ...S.chatRow,
                                                                                        justifyContent: mine ? "flex-end" : "flex-start",
                                                                                    }}
                                                                                >
                                                                                    {!mine ? (
                                                                                        <div style={S.chatOtherAvatar}>
                                                                                            {(msg.senderName || "M").charAt(0).toUpperCase()}
                                                                                        </div>
                                                                                    ) : null}
                                                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 2, maxWidth: "60%" }}>
                                                                                        {!mine ? (
                                                                                            <span style={S.chatSenderName}>
                                                                                                {msg.senderName}
                                                                                            </span>
                                                                                        ) : null}
                                                                                        <div
                                                                                            style={{
                                                                                                ...S.chatBubble,
                                                                                                ...(mine ? S.chatBubbleMine : S.chatBubbleOther),
                                                                                            }}
                                                                                        >
                                                                                            <p style={S.chatText}>{msg.text}</p>
                                                                                        </div>
                                                                                        <span style={S.chatTimestamp}>
                                                                                            {new Date(msg.sentAt).toLocaleTimeString(undefined, {
                                                                                                hour: "2-digit",
                                                                                                minute: "2-digit",
                                                                                            })}
                                                                                        </span>
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
                                                                                void sendMessage();
                                                                            }
                                                                        }}
                                                                        placeholder="Type a message..."
                                                                        style={S.chatInput}
                                                                        disabled={chatSending}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => void sendMessage()}
                                                                        style={{ ...S.chatSendBtn, opacity: chatSending ? 0.6 : 1 }}
                                                                        disabled={chatSending}
                                                                    >
                                                                        {chatSending ? "…" : "➤"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {showMembers ? (
                                                                <aside style={S.chatMembersSidePanel}>
                                                                    <div style={S.membersDropdownHeader}>
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
                                                                                            ...(isCurrentUser ? S.chatMemberRowActive : {}),
                                                                                        }}
                                                                                    >
                                                                                        <div style={S.studentAvatar}>
                                                                                            {studentName.charAt(0).toUpperCase()}
                                                                                        </div>
                                                                                        <p style={S.chatMemberName}>
                                                                                            <ProfileLink userId={student.userId ?? student.UserId} role="student" style={{ color: "#1f2937" }}>
                                                                                                {studentName}
                                                                                            </ProfileLink>
                                                                                            {isCurrentUser ? " (You)" : ""}
                                                                                        </p>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </aside>
                                                            ) : null}
                                                        </div>
                                                    </section>
                                                )}
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

                                                {detailsLoading ? (
                                                    <p style={S.note}>Loading projects…</p>
                                                ) : mySectionProjects.length === 0 ? (
                                                    <div style={S.emptyState}>
                                                        <FolderKanban size={20} color="#94a3b8" />
                                                        <p style={S.emptyTitle}>No projects posted yet.</p>
                                                        <p style={S.emptyText}>The doctor hasn't added any projects to your section.</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                        {mySectionProjects.map((project) => {
                                                            console.log("REAL PROJECT", project);
                                                            console.log("PROJECT MODE DATA", project);
                                                            const sectionName =
                                                                project.applyToAllSections
                                                                    ? "All sections"
                                                                    : (mySection?.name ?? "My section");
                                                            const projectRaw = project as {
                                                                teamFormationMode?: string;
                                                                assignmentMode?: string;
                                                                teamMode?: string;
                                                                formationMode?: string;
                                                                isDoctorAssigned?: boolean;
                                                                allowStudentSelection?: boolean;
                                                                hasTeam?: boolean;
                                                            };
                                                            const modeText = String(
                                                                projectRaw.teamFormationMode ??
                                                                    projectRaw.assignmentMode ??
                                                                    projectRaw.teamMode ??
                                                                    projectRaw.formationMode ??
                                                                    "",
                                                            )
                                                                .trim()
                                                                .toLowerCase();
                                                            const doctorAssignedByMode =
                                                                modeText.includes("doctor") ||
                                                                modeText.includes("ai") ||
                                                                modeText.includes("auto");
                                                            const studentAssignedByMode =
                                                                modeText.includes("student") ||
                                                                modeText.includes("manual") ||
                                                                modeText.includes("self");
                                                            const isDoctorAssigned =
                                                                typeof projectRaw.isDoctorAssigned === "boolean"
                                                                    ? projectRaw.isDoctorAssigned
                                                                    : (typeof projectRaw.allowStudentSelection === "boolean"
                                                                        ? !projectRaw.allowStudentSelection
                                                                        : (doctorAssignedByMode
                                                                            ? true
                                                                            : (studentAssignedByMode ? false : project.aiMode === "doctor")));
                                                            const hasTeam = projectRaw.hasTeam === true;
                                                            return (
                                                            <div key={project.id} style={S.projectCard}>
                                                                <div style={S.projectTopRow}>
                                                                    <div style={S.projectLeftCol}>
                                                                        <p style={S.projectTitle}>{project.title}</p>
                                                                        <span style={S.projectMetaLineCompact}>Team size: {project.teamSize}</span>
                                                                        <span style={S.projectMetaLineCompact}>Section: {sectionName}</span>
                                                                    </div>
                                                                    <div style={S.projectRightCol}>
                                                                        <div style={S.projectActionRow}>
                                                                            <span
                                                                                style={
                                                                                    isDoctorAssigned
                                                                                        ? S.assignedBadge
                                                                                        : S.studentSelectionBadge
                                                                                }
                                                                            >
                                                                                {isDoctorAssigned
                                                                                    ? "Assigned by Doctor"
                                                                                    : "Student Selection"}
                                                                            </span>
                                                                            {isDoctorAssigned || hasTeam ? (
                                                                                <button
                                                                                    type="button"
                                                                                    style={S.teamViewBtn}
                                                                                    onClick={() => navigate(`/student/team/${project.id}`)}
                                                                                >
                                                                                    View My Team
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    type="button"
                                                                                    style={S.generateTeamBtn}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigate(`/student/projects/${project.id}/ai-team`);
                                                                                    }}
                                                                                >
                                                                                    Choose Teammates
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Description */}
                                                                {project.description ? (
                                                                    <p style={S.projectDesc}>{project.description}</p>
                                                                ) : null}

                                                                {/* Meta */}
                                                                <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" as const }}>
                                                                    {project.allowCrossSectionTeams && (
                                                                        <span style={S.projectMetaChip}>
                                                                            Cross-section teams allowed
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p style={S.projectHintText}>
                                                                    {project.applyToAllSections
                                                                        ? "You can choose teammates from the whole course."
                                                                        : "You can choose teammates from your section only."}
                                                                </p>
                                                            </div>
                                                            );
                                                        })}
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
    projectTopRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
    },
    projectLeftCol: {
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    projectRightCol: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
    },
    projectActionRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    projectTitle: {
        margin: 0,
        fontSize: 14,
        fontWeight: 800,
        color: "#1f2937",
    },
    projectMetaLineCompact: {
        fontSize: 12,
        color: "#6b7280",
        lineHeight: 1.4,
    },
    assignedBadge: {
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#6d28d9",
        background: "#f3e8ff",
        border: "1px solid #e9d5ff",
        borderRadius: 999,
        padding: "4px 8px",
    },
    studentSelectionBadge: {
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#1d4ed8",
        background: "#dbeafe",
        border: "1px solid #bfdbfe",
        borderRadius: 999,
        padding: "4px 8px",
    },
    teamViewBtn: {
        border: "none",
        borderRadius: 10,
        background: "#7c3aed",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    chooseTeamBtn: {
        border: "1px solid #c4b5fd",
        borderRadius: 10,
        background: "#f5f3ff",
        color: "#6d28d9",
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    generateTeamBtn: {
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 4px 14px rgba(124,58,237,0.28)",
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
    projectHintText: {
        margin: 0,
        fontSize: 12,
        color: "#6b7280",
        lineHeight: 1.45,
    },
    projectMetaChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        color: "#6b7280",
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "3px 8px",
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
        height: 400,
        overflow: "hidden",
    },
    chatBody: {
        display: "grid",
        flex: 1,
        minHeight: 0,
    },
    chatConversationCol: {
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
    },
    chatHeader: {
        padding: "10px 12px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    chatHeaderLeft: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
    },
    chatGroupAvatar: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    chatHeaderTitle: {
        margin: 0,
        fontSize: 14,
        fontWeight: 800,
        color: "#1f2937",
    },
    chatHeaderSubTitle: {
        margin: "3px 0 0",
        fontSize: 11,
        color: "#6b7280",
    },
    chatMessages: {
        flex: 1,
        overflowY: "auto" as const,
        overflowX: "hidden" as const,
        padding: "12px 14px",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column" as const,
        gap: 10,
    },
    chatRow: {
        display: "flex",
        width: "100%",
        alignItems: "flex-end",
        gap: 8,
    },
    chatBubble: {
        maxWidth: "65%",
        minWidth: 60,
        borderRadius: 14,
        padding: "8px 12px",
        wordBreak: "break-word",
        overflowWrap: "break-word",
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
        lineHeight: 1.5,
        wordBreak: "break-word" as const,
        overflowWrap: "break-word" as const,
        whiteSpace: "normal",
    },
    chatOtherAvatar: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "#e5e7eb",
        color: "#475569",
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    chatSenderName: {
        margin: "0 0 2px",
        fontSize: 11,
        fontWeight: 700,
        color: "#6b7280",
        paddingLeft: 2,
    },
    chatTimestamp: {
        margin: "2px 0 0",
        fontSize: 10,
        color: "#94a3b8",
        paddingLeft: 2,
        paddingRight: 2,
    },
    chatInputRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 10,
        borderTop: "1px solid #e5e7eb",
        background: "#fafafa",
    },
    chatMembersSidePanel: {
        borderLeft: "1px solid #e5e7eb",
        background: "#ffffff",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
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
        borderRadius: 999,
        background: "#fff",
        padding: "10px 14px",
        fontSize: 13,
        color: "#1f2937",
        fontFamily: "inherit",
        outline: "none",
    },
    chatSendBtn: {
        border: "none",
        borderRadius: "50%",
        width: 36,
        height: 36,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        background: "#7c3aed",
        color: "#fff",
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    membersDropdown: {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 280,
        maxHeight: 300,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        boxShadow: "0 12px 28px rgba(15,23,42,0.18)",
        zIndex: 20,
        padding: 8,
    },
    membersDropdownHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "4px 2px 8px",
        borderBottom: "1px solid #f1f5f9",
        marginBottom: 8,
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