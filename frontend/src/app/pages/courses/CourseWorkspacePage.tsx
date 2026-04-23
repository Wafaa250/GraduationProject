import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
    ArrowLeft,
    BookOpen,
    Copy,
    FolderKanban,
    Layers,
    Plus,
    Save,
    Settings2,
    Users,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";
import {
    CreateSectionForm,
    formatSectionSchedule,
    type NewSectionPayload,
} from "./CreateSectionForm";
import type { CourseWorkspaceLocationState, NewWorkspaceProjectPayload } from "./courseProjectTypes";
import {
    createDoctorCourseSection,
    getDoctorCourseSections,
    getDoctorCourseProjects,
    type DoctorCourseProject,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

type WorkspaceTab = "sections" | "projects" | "settings";

type WorkspaceSection = NewSectionPayload & { id: string };

// WorkspaceProject is now the real API type for numeric courseIds.
// For temp courses it falls back to the local draft shape.
type WorkspaceProject = NewWorkspaceProjectPayload & { id: string };

/** Local-only course settings (Settings tab); not persisted, no API. */
type CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: boolean;
    maxTeamSize: string;
    minTeamSize: string;
    enableAiTeamAssignment: boolean;
    allowStudentsChooseTeammates: boolean;
    allowMultipleProjectsPerSection: boolean;
    maxProjectsPerCourse: string;
    teamFormationDeadline: string;
    projectSubmissionDeadline: string;
};

const defaultCourseWorkspaceSettings: CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: false,
    maxTeamSize: "6",
    minTeamSize: "2",
    enableAiTeamAssignment: true,
    allowStudentsChooseTeammates: false,
    allowMultipleProjectsPerSection: false,
    maxProjectsPerCourse: "5",
    teamFormationDeadline: "",
    projectSubmissionDeadline: "",
};

function SettingsToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
            }}
        >
            <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.text, lineHeight: 1.35 }}>{label}</p>
                {description ? (
                    <p style={{ margin: "5px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>{description}</p>
                ) : null}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                style={toggleSwitchTrackStyle(checked)}
            >
                <span style={toggleSwitchThumbStyle(checked)} aria-hidden />
            </button>
        </div>
    );
}

function toggleSwitchTrackStyle(on: boolean): CSSProperties {
    return {
        position: "relative",
        width: 46,
        height: 26,
        flexShrink: 0,
        borderRadius: 999,
        border: `1px solid ${on ? dash.accent : dash.border}`,
        background: on ? dash.accent : "#e2e8f0",
        cursor: "pointer",
        padding: 0,
        transition: "background 0.15s ease, border-color 0.15s ease",
    };
}

function toggleSwitchThumbStyle(on: boolean): CSSProperties {
    return {
        position: "absolute",
        top: 3,
        left: on ? 22 : 3,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(15,23,42,0.2)",
        transition: "left 0.15s ease",
        display: "block",
    };
}

const TABS: { id: WorkspaceTab; label: string; icon: typeof Layers }[] = [
    { id: "sections", label: "Sections", icon: Layers },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "settings", label: "Settings", icon: Settings2 },
];

function cwSectionsStorageKey(cid: string | undefined) {
    return cid ? `cw-ui-sections-${cid}` : null;
}

function cwProjectsStorageKey(cid: string | undefined) {
    return cid ? `cw-ui-projects-${cid}` : null;
}

function courseHeaderMetaKey(cid: string | undefined) {
    return cid ? `cw-ui-course-meta-${cid}` : null;
}

/**
 * Returns the numeric backend course id when courseId is a real course,
 * or null for local draft ids (e.g. "temp-1234..."). We only hit the API
 * for numeric ids — temp courses stay session-local.
 */
function parseBackendCourseId(cid: string | undefined): number | null {
    if (!cid) return null;
    if (/^\d+$/.test(cid.trim())) {
        const n = Number(cid);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
}

type CourseHeaderMeta = { name: string; code: string };

function readCourseHeaderMeta(cid: string | undefined): CourseHeaderMeta {
    if (!cid?.trim()) return { name: "Course", code: "—" };
    const key = courseHeaderMetaKey(cid);
    if (!key) return { name: "Course", code: "—" };
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return { name: "Course", code: "—" };
        const o = JSON.parse(raw) as { name?: string; code?: string };
        const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : "Course";
        const code = typeof o.code === "string" && o.code.trim() ? o.code.trim() : "—";
        return { name, code };
    } catch {
        return { name: "Course", code: "—" };
    }
}

function readJsonStorage<T>(key: string | null, fallback: T): T {
    if (!key) return fallback;
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export default function CourseWorkspacePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { courseId } = useParams<{ courseId: string }>();
    const [activeTab, setActiveTab] = useState<WorkspaceTab>("sections");
    const [sections, setSections] = useState<WorkspaceSection[]>([]);
    const [projects, setProjects] = useState<WorkspaceProject[]>([]);
    const [apiProjects, setApiProjects] = useState<DoctorCourseProject[]>([]);
    const [showCreateSection, setShowCreateSection] = useState(false);
    const [courseSettings, setCourseSettings] = useState<CourseWorkspaceSettingsForm>(defaultCourseWorkspaceSettings);
    const [courseHeader, setCourseHeader] = useState<CourseHeaderMeta>(() => readCourseHeaderMeta(courseId));
    const [copiedCode, setCopiedCode] = useState(false);
    const [creatingSection, setCreatingSection] = useState(false);
    const { showToast } = useToast();
    const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const key = courseHeaderMetaKey(courseId);
        const st = location.state as CourseWorkspaceLocationState | null;
        if (key && st && (st.courseName != null || st.courseCode != null)) {
            const prev = readCourseHeaderMeta(courseId);
            const nameIn = st.courseName != null ? String(st.courseName).trim() : "";
            const codeIn = st.courseCode != null ? String(st.courseCode).trim() : "";
            const next: CourseHeaderMeta = {
                name: nameIn || prev.name,
                code: codeIn || prev.code,
            };
            try {
                sessionStorage.setItem(key, JSON.stringify(next));
            } catch {
                /* ignore */
            }
        }
        setCourseHeader(readCourseHeaderMeta(courseId));
    }, [courseId, location.state]);

    useEffect(() => {
        // For real (numeric) courses the backend is the source of truth — skip
        // sessionStorage so there is no stale-data race on mount.
        if (parseBackendCourseId(courseId) != null) return;
        const sk = cwSectionsStorageKey(courseId);
        const pk = cwProjectsStorageKey(courseId);
        setSections(readJsonStorage<WorkspaceSection[]>(sk, []));
        setProjects(readJsonStorage<WorkspaceProject[]>(pk, []));
    }, [courseId]);

    // Load sections from the backend for real (numeric) courseIds.
    // Temp drafts stay session-local.
    useEffect(() => {
        const backendId = parseBackendCourseId(courseId);
        if (backendId == null) return;
        let cancelled = false;
        getDoctorCourseSections(backendId)
            .then((apiSections) => {
                if (cancelled) return;
                setSections(
                    apiSections.map((s) => ({
                        id: String(s.id),
                        name: s.name,
                        days: s.days,
                        timeFrom: s.timeFrom ?? "",
                        timeTo: s.timeTo ?? "",
                        capacity: s.capacity,
                    })),
                );
            })
            .catch((err) => {
                if (cancelled) return;
                showToast(parseApiErrorMessage(err), "error");
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]); // courseId only — re-fetch when navigating to a different course

    // Load projects from backend for real courses
    useEffect(() => {
        const backendId = parseBackendCourseId(courseId);
        if (backendId == null) return;
        let cancelled = false;
        getDoctorCourseProjects(backendId)
            .then((data) => { if (!cancelled) setApiProjects(data); })
            .catch(() => { /* non-critical, silently ignore */ });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    useEffect(() => {
        // Real courses are persisted in the backend — no need to cache sections locally.
        if (parseBackendCourseId(courseId) != null) return;
        const key = cwSectionsStorageKey(courseId);
        if (!key) return;
        try {
            sessionStorage.setItem(key, JSON.stringify(sections));
        } catch {
            /* ignore */
        }
    }, [courseId, sections]);

    useEffect(() => {
        const key = cwProjectsStorageKey(courseId);
        if (!key) return;
        try {
            sessionStorage.setItem(key, JSON.stringify(projects));
        } catch {
            /* ignore */
        }
    }, [courseId, projects]);

    useEffect(() => {
        const st = location.state as CourseWorkspaceLocationState | null;
        const np = st?.newProject;
        const nonce = st?.importNonce;
        if (!np || !courseId || nonce == null || typeof nonce !== "number") return;
        const dedupeKey = `cw-ui-proj-import:${courseId}:${nonce}`;
        if (sessionStorage.getItem(dedupeKey)) {
            navigate(".", { replace: true, state: {} });
            return;
        }
        try {
            sessionStorage.setItem(dedupeKey, "1");
        } catch {
            /* ignore */
        }
        setProjects((prev) => [...prev, { ...np, id: `temp-${Date.now()}` }]);
        setActiveTab("projects");
        navigate(".", { replace: true, state: {} });
    }, [location.state, courseId, navigate]);

    const handleAddSection = async (payload: NewSectionPayload) => {
        if (creatingSection) return;
        const backendId = parseBackendCourseId(courseId);
        // Temp / draft course → keep legacy local-only behaviour.
        if (backendId == null) {
            setSections((prev) => [...prev, { ...payload, id: `temp-${Date.now()}` }]);
            setShowCreateSection(false);
            return;
        }
        setCreatingSection(true);
        try {
            const created = await createDoctorCourseSection(backendId, {
                name: payload.name,
                days: payload.days,
                timeFrom: payload.timeFrom,
                timeTo: payload.timeTo,
                capacity: payload.capacity,
            });
            setSections((prev) => [
                ...prev,
                {
                    id: String(created.id),
                    name: created.name,
                    days: created.days,
                    timeFrom: created.timeFrom ?? "",
                    timeTo: created.timeTo ?? "",
                    capacity: created.capacity,
                },
            ]);
            setShowCreateSection(false);
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setCreatingSection(false);
        }
    };

    const openCreateProject = () => {
        if (!courseId) return;
        navigate(`/courses/${courseId}/projects/create`, {
            state: { sections: sections.map((s) => ({ id: s.id, name: s.name })) },
        });
    };

    const copyCourseCode = async () => {
        const text = courseHeader.code;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCode(true);
            if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
            copyFeedbackTimerRef.current = setTimeout(() => {
                setCopiedCode(false);
                copyFeedbackTimerRef.current = null;
            }, 1500);
        } catch {
            /* clipboard unavailable */
        }
    };

    const saveCourseSettings = () => {
        // eslint-disable-next-line no-console
        console.log("Course settings (local draft)", courseSettings);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: dash.bg,
                fontFamily: dash.font,
                color: dash.text,
                padding: "24px 28px 40px",
            }}
        >
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                <button
                    type="button"
                    onClick={() => navigate("/doctor-dashboard?tab=my-courses")}
                    style={S.backBtn}
                >
                    <ArrowLeft size={18} />
                    Back to courses
                </button>

                <header style={{ ...card, padding: "22px 24px", marginTop: 20 }}>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 16,
                        }}
                    >
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                                style={{
                                    margin: "0 0 6px",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: dash.subtle,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Course workspace
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 8,
                                    rowGap: 10,
                                }}
                            >
                                <h1
                                    style={{
                                        margin: 0,
                                        fontSize: 22,
                                        fontWeight: 800,
                                        fontFamily: dash.fontDisplay,
                                        color: dash.text,
                                        lineHeight: 1.25,
                                    }}
                                >
                                    {courseHeader.name}
                                </h1>
                                <span style={S.codeBadge} title="Course code">
                                    {courseHeader.code}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => void copyCourseCode()}
                                    style={S.copyIconBtn}
                                    aria-label={`Copy course code ${courseHeader.code}`}
                                >
                                    <Copy size={16} strokeWidth={2.25} aria-hidden />
                                </button>
                                {copiedCode ? (
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: dash.accent,
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        Copied!
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </header>

                <div
                    style={{
                        marginTop: 20,
                        borderBottom: `1px solid ${dash.border}`,
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                    }}
                    role="tablist"
                    aria-label="Course workspace"
                >
                    {TABS.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setActiveTab(id)}
                                style={tabButtonStyle(active)}
                            >
                                <Icon size={17} strokeWidth={active ? 2.25 : 2} />
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div style={{ marginTop: 24 }}>
                    {activeTab === "sections" ? (
                        <section style={{ ...card, padding: 0, overflow: "hidden" }} aria-labelledby="cw-sections-title">
                            <div
                                style={{
                                    padding: "16px 20px",
                                    borderBottom: `1px solid ${dash.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                    <BookOpen size={18} color={dash.accent} style={{ flexShrink: 0 }} />
                                    <div>
                                        <h2
                                            id="cw-sections-title"
                                            style={{
                                                margin: 0,
                                                fontSize: 15,
                                                fontWeight: 800,
                                                fontFamily: dash.fontDisplay,
                                                color: dash.text,
                                            }}
                                        >
                                            Sections
                                        </h2>
                                        <p style={{ margin: "4px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
                                            Organize teaching groups for this course.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    style={S.primaryBtn}
                                    onClick={() => setShowCreateSection(true)}
                                >
                                    <Plus size={17} />
                                    Create Section
                                </button>
                            </div>

                            {showCreateSection ? (
                                <CreateSectionForm
                                    onSubmit={handleAddSection}
                                    onCancel={() => setShowCreateSection(false)}
                                />
                            ) : null}

                            {sections.length > 0 ? (
                                <ul
                                    style={{
                                        listStyle: "none",
                                        margin: 0,
                                        padding: "8px 20px 24px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 14,
                                    }}
                                >
                                    {sections.map((s) => (
                                        <li
                                            key={s.id}
                                            style={{
                                                ...card,
                                                padding: "18px 18px 16px",
                                                boxShadow: dash.shadow,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                }}
                                            >
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <h3
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 16,
                                                            fontWeight: 800,
                                                            fontFamily: dash.fontDisplay,
                                                            color: dash.text,
                                                            lineHeight: 1.3,
                                                        }}
                                                    >
                                                        {s.name}
                                                    </h3>
                                                    <p
                                                        style={{
                                                            margin: "8px 0 0",
                                                            fontSize: 13,
                                                            color: dash.muted,
                                                            lineHeight: 1.45,
                                                        }}
                                                    >
                                                        {formatSectionSchedule(s.days, s.timeFrom, s.timeTo)}
                                                    </p>
                                                    <p style={{ margin: "6px 0 0", fontSize: 12, color: dash.subtle }}>
                                                        Capacity:{" "}
                                                        <span style={{ fontWeight: 700, color: dash.text }}>{s.capacity}</span>{" "}
                                                        students
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    style={S.secondaryBtn}
                                                    onClick={() => {
                                                        if (!courseId) return;
                                                        navigate(`/courses/${courseId}/sections/${s.id}/students`);
                                                    }}
                                                >
                                                    <Users size={16} />
                                                    Manage Students
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : !showCreateSection ? (
                                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                                    <Layers size={40} color="#cbd5e1" style={{ marginBottom: 14 }} />
                                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.muted }}>
                                        No sections yet
                                    </p>
                                    <p
                                        style={{
                                            margin: "10px auto 0",
                                            fontSize: 13,
                                            color: dash.subtle,
                                            lineHeight: 1.55,
                                            maxWidth: 400,
                                        }}
                                    >
                                        Use <strong style={{ color: dash.text }}>Create Section</strong> to define
                                        schedules and capacity for each teaching group.
                                    </p>
                                </div>
                            ) : (
                                <p
                                    style={{
                                        margin: "0 20px 24px",
                                        padding: "0 4px",
                                        fontSize: 13,
                                        color: dash.subtle,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Fill in the form above, then choose <strong style={{ color: dash.text }}>Add section</strong>{" "}
                                    to see it listed here.
                                </p>
                            )}
                        </section>
                    ) : null}

                    {activeTab === "projects" ? (
                        <section style={{ ...card, padding: 0, overflow: "hidden" }} aria-labelledby="cw-projects-title">
                            <div
                                style={{
                                    padding: "16px 20px",
                                    borderBottom: `1px solid ${dash.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                    <FolderKanban size={18} color={dash.accent} style={{ flexShrink: 0 }} />
                                    <div>
                                        <h2
                                            id="cw-projects-title"
                                            style={{
                                                margin: 0,
                                                fontSize: 15,
                                                fontWeight: 800,
                                                fontFamily: dash.fontDisplay,
                                                color: dash.text,
                                            }}
                                        >
                                            Projects
                                        </h2>
                                        <p style={{ margin: "4px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
                                            Course projects and team formation settings.
                                        </p>
                                    </div>
                                </div>
                                <button type="button" style={S.primaryBtn} onClick={openCreateProject}>
                                    <Plus size={17} />
                                    Create Project
                                </button>
                            </div>

                            {(() => {
                                const isReal = parseBackendCourseId(courseId) != null;
                                const displayProjects = isReal ? apiProjects : projects;
                                if (displayProjects.length > 0) {
                                    return (
                                        <ul style={{ listStyle: "none", margin: 0, padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                                            {isReal
                                                ? (apiProjects as DoctorCourseProject[]).map((p) => (
                                                    <li key={p.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => { if (p.aiMode !== "student") navigate(`/courses/${courseId}/projects/${p.id}/teams`, { state: { projectName: p.title, projectId: p.id } }); }}
                                                            style={{ ...card, width: "100%", padding: "18px 18px 16px", boxShadow: dash.shadow, display: "flex", flexDirection: "column", gap: 8, textAlign: "left", cursor: "pointer", fontFamily: "inherit", border: `1px solid ${dash.border}`, transition: "transform 0.12s ease, box-shadow 0.12s ease" }}
                                                            className="dd-course-card-btn"
                                                        >
                                                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: dash.fontDisplay, color: dash.text, lineHeight: 1.3 }}>
                                                                {p.title}
                                                            </h3>
                                                            <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                                                                <span style={{ fontWeight: 700, color: dash.text }}>Sections:</span>{" "}
                                                                {p.applyToAllSections ? "All sections" : p.sections.map((s) => s.sectionName).join(", ") || "—"}
                                                            </p>
                                                            <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                                                                <span style={{ fontWeight: 700, color: dash.text }}>Team size:</span> {p.teamSize}
                                                            </p>
                                                            {p.description ? (
                                                                <p style={{ margin: 0, fontSize: 12, color: dash.subtle, lineHeight: 1.45 }}>{p.description}</p>
                                                            ) : null}
                                                            {p.aiMode !== "student" && (
                                                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                                                                    <span style={{ fontSize: 12, fontWeight: 700, color: dash.accent }}>View AI teams →</span>
                                                                </div>
                                                            )}
                                                        </button>
                                                    </li>
                                                ))
                                                : (projects as WorkspaceProject[]).map((p) => (
                                                    <li key={p.id} style={{ ...card, padding: "18px 18px 16px", boxShadow: dash.shadow, display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: dash.fontDisplay, color: dash.text }}>{p.title}</h3>
                                                        <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                                                            <span style={{ fontWeight: 700, color: dash.text }}>Section:</span> {p.sectionLabel}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                                                            <span style={{ fontWeight: 700, color: dash.text }}>Team size:</span> {p.teamSize}
                                                        </p>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    );
                                }
                                return (
                                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                                        <FolderKanban size={40} color="#cbd5e1" style={{ marginBottom: 14 }} />
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.muted }}>No projects yet</p>
                                        <p style={{ margin: "10px auto 0", fontSize: 13, color: dash.subtle, lineHeight: 1.55, maxWidth: 420 }}>
                                            Use <strong style={{ color: dash.text }}>Create Project</strong> to define title, scope, and section targeting.
                                        </p>
                                    </div>
                                );
                            })()}
                        </section>
                    ) : null}

                    {activeTab === "settings" ? (
                        <section style={{ ...card, padding: 0, overflow: "hidden" }} aria-labelledby="cw-settings-title">
                            <div
                                style={{
                                    padding: "16px 20px",
                                    borderBottom: `1px solid ${dash.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 16,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                    <Settings2 size={18} color={dash.accent} style={{ flexShrink: 0 }} />
                                    <div>
                                        <h2
                                            id="cw-settings-title"
                                            style={{
                                                margin: 0,
                                                fontSize: 15,
                                                fontWeight: 800,
                                                fontFamily: dash.fontDisplay,
                                                color: dash.text,
                                            }}
                                        >
                                            Course settings
                                        </h2>
                                        <p style={{ margin: "4px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
                                            Team rules, AI behavior, and project deadlines (local only until an API is connected).
                                        </p>
                                    </div>
                                </div>
                                <button type="button" style={S.primaryBtn} onClick={saveCourseSettings}>
                                    <Save size={17} />
                                    Save
                                </button>
                            </div>

                            <div
                                style={{
                                    padding: "20px 20px 28px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 20,
                                }}
                            >
                                <article
                                    style={{
                                        ...card,
                                        padding: 20,
                                        boxShadow: dash.shadow,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 18,
                                    }}
                                >
                                    <h3 style={SET.sectionTitle}>Team rules</h3>
                                    <SettingsToggleRow
                                        label="Allow cross-section teams"
                                        description="Students may form teams across different teaching sections."
                                        checked={courseSettings.allowCrossSectionTeams}
                                        onChange={(v) => setCourseSettings((s) => ({ ...s, allowCrossSectionTeams: v }))}
                                    />
                                    <div style={SET.row}>
                                        <label style={{ ...SET.label, flex: "1 1 140px", minWidth: 0 }}>
                                            Min team size
                                            <input
                                                style={SET.input}
                                                type="number"
                                                min={1}
                                                max={50}
                                                value={courseSettings.minTeamSize}
                                                onChange={(e) => setCourseSettings((s) => ({ ...s, minTeamSize: e.target.value }))}
                                            />
                                        </label>
                                        <label style={{ ...SET.label, flex: "1 1 140px", minWidth: 0 }}>
                                            Max team size
                                            <input
                                                style={SET.input}
                                                type="number"
                                                min={1}
                                                max={50}
                                                value={courseSettings.maxTeamSize}
                                                onChange={(e) => setCourseSettings((s) => ({ ...s, maxTeamSize: e.target.value }))}
                                            />
                                        </label>
                                    </div>
                                </article>

                                <article
                                    style={{
                                        ...card,
                                        padding: 20,
                                        boxShadow: dash.shadow,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 18,
                                    }}
                                >
                                    <h3 style={SET.sectionTitle}>AI settings</h3>
                                    <SettingsToggleRow
                                        label="Enable AI team assignment"
                                        description="Use AI suggestions when forming or balancing teams."
                                        checked={courseSettings.enableAiTeamAssignment}
                                        onChange={(v) => setCourseSettings((s) => ({ ...s, enableAiTeamAssignment: v }))}
                                    />
                                    <SettingsToggleRow
                                        label="Allow students to choose teammates"
                                        description="When off, team composition is guided by course rules or staff."
                                        checked={courseSettings.allowStudentsChooseTeammates}
                                        onChange={(v) => setCourseSettings((s) => ({ ...s, allowStudentsChooseTeammates: v }))}
                                    />
                                </article>

                                <article
                                    style={{
                                        ...card,
                                        padding: 20,
                                        boxShadow: dash.shadow,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 18,
                                    }}
                                >
                                    <h3 style={SET.sectionTitle}>Project rules</h3>
                                    <SettingsToggleRow
                                        label="Allow multiple projects per section"
                                        description="Sections can run more than one active project at a time."
                                        checked={courseSettings.allowMultipleProjectsPerSection}
                                        onChange={(v) => setCourseSettings((s) => ({ ...s, allowMultipleProjectsPerSection: v }))}
                                    />
                                    <label style={SET.label}>
                                        Max projects per course
                                        <input
                                            style={{ ...SET.input, maxWidth: 200 }}
                                            type="number"
                                            min={1}
                                            max={99}
                                            value={courseSettings.maxProjectsPerCourse}
                                            onChange={(e) => setCourseSettings((s) => ({ ...s, maxProjectsPerCourse: e.target.value }))}
                                        />
                                    </label>
                                </article>

                                <article
                                    style={{
                                        ...card,
                                        padding: 20,
                                        boxShadow: dash.shadow,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 18,
                                    }}
                                >
                                    <h3 style={SET.sectionTitle}>Timeline</h3>
                                    <div style={SET.row}>
                                        <label style={{ ...SET.label, flex: "1 1 200px", minWidth: 0 }}>
                                            Team formation deadline
                                            <input
                                                style={SET.input}
                                                type="date"
                                                value={courseSettings.teamFormationDeadline}
                                                onChange={(e) =>
                                                    setCourseSettings((s) => ({ ...s, teamFormationDeadline: e.target.value }))
                                                }
                                            />
                                        </label>
                                        <label style={{ ...SET.label, flex: "1 1 200px", minWidth: 0 }}>
                                            Project submission deadline
                                            <input
                                                style={SET.input}
                                                type="date"
                                                value={courseSettings.projectSubmissionDeadline}
                                                onChange={(e) =>
                                                    setCourseSettings((s) => ({ ...s, projectSubmissionDeadline: e.target.value }))
                                                }
                                            />
                                        </label>
                                    </div>
                                </article>
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

const SET: Record<string, CSSProperties> = {
    sectionTitle: {
        margin: 0,
        fontSize: 11,
        fontWeight: 700,
        color: dash.subtle,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
    },
    label: {
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: dash.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 0,
    },
    input: {
        width: "100%",
        marginTop: 6,
        padding: "11px 12px",
        borderRadius: 10,
        border: `1.5px solid ${dash.border}`,
        fontSize: 14,
        color: dash.text,
        boxSizing: "border-box",
        fontFamily: dash.font,
        background: dash.surface,
    },
    row: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "flex-end",
    },
};

function tabButtonStyle(active: boolean): CSSProperties {
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 16px",
        marginBottom: -1,
        border: "none",
        borderBottom: active ? `2px solid ${dash.accent}` : "2px solid transparent",
        background: "transparent",
        color: active ? dash.accent : dash.muted,
        fontSize: 14,
        fontWeight: active ? 700 : 600,
        cursor: "pointer",
        fontFamily: dash.font,
        borderRadius: "10px 10px 0 0",
        transition: "color 0.15s ease, border-color 0.15s ease",
    };
}

const S: Record<string, CSSProperties> = {
    backBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 10,
        border: `1px solid ${dash.border}`,
        background: dash.surface,
        color: dash.muted,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: dash.font,
    },
    primaryBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "11px 18px",
        borderRadius: 10,
        border: "none",
        background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: dash.font,
        boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
    },
    /** Course code chip — matches My Courses row code styling. */
    codeBadge: {
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 8px",
        borderRadius: 8,
        background: dash.accentMuted,
        color: dash.accent,
        border: "1px solid #c7d2fe",
        letterSpacing: "0.04em",
        fontFamily: dash.font,
        lineHeight: 1.35,
    },
    copyIconBtn: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 8,
        border: `1px solid ${dash.border}`,
        background: dash.surface,
        color: dash.muted,
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        fontFamily: dash.font,
        transition: "background 0.12s ease, border-color 0.12s ease, color 0.12s ease",
    },
    secondaryBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        borderRadius: 10,
        border: `1px solid ${dash.border}`,
        background: dash.surface,
        color: dash.muted,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: dash.font,
        flexShrink: 0,
    },
};