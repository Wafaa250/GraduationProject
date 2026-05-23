import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Copy, FolderKanban, Layers, Save, Settings2 } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import type { NewSectionPayload } from "./CreateSectionForm";
import { CourseWorkspaceSectionsPanel } from "./CourseWorkspaceSectionsPanel";
import { CourseWorkspaceProjectsPanel } from "./CourseWorkspaceProjectsPanel";
import type { CourseWorkspaceLocationState, NewWorkspaceProjectPayload } from "./courseProjectTypes";
import { parseBackendCourseId } from "./courseProjectUtils";
import {
    createDoctorCourseSection,
    getDoctorCourseSections,
    getDoctorProjectTeams,
    getDoctorCourseProjects,
    type DoctorCourseProject,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

type WorkspaceTab = "sections" | "projects" | "settings";

type SectionStudent = {
    id: string;
    name: string;
    email?: string;
};

type WorkspaceSection = NewSectionPayload & { id: string; students?: SectionStudent[] };

// WorkspaceProject is now the real API type for numeric courseIds.
// For temp courses it falls back to the local draft shape.
type WorkspaceProject = NewWorkspaceProjectPayload & { id: string };

/** Local-only course settings (Settings tab); not persisted, no API. */
type CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: boolean;
    enableAiTeamAssignment: boolean;
    allowStudentsChooseTeammates: boolean;
    allowMultipleProjectsPerSection: boolean;
    teamFormationDeadline: string;
    projectSubmissionDeadline: string;
};

const defaultCourseWorkspaceSettings: CourseWorkspaceSettingsForm = {
    allowCrossSectionTeams: false,
    enableAiTeamAssignment: true,
    allowStudentsChooseTeammates: false,
    allowMultipleProjectsPerSection: false,
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

function normalizeSectionStudents(raw: unknown): SectionStudent[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item, index) => {
            const student = item as Record<string, unknown>;
            const nameRaw =
                student.name ??
                student.Name ??
                student.fullName ??
                student.FullName ??
                student.studentName ??
                student.StudentName;
            const emailRaw = student.email ?? student.Email;
            const idRaw = student.id ?? student.Id ?? student.studentId ?? student.StudentId ?? index;
            const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
            if (!name) return null;
            const email = typeof emailRaw === "string" && emailRaw.trim() ? emailRaw.trim() : undefined;
            return { id: String(idRaw), name, email };
        })
        .filter((student): student is SectionStudent => student !== null);
}

export default function CourseWorkspacePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { courseId } = useParams<{ courseId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab: WorkspaceTab = (() => {
        const t = searchParams.get("tab");
        if (t === "projects" || t === "settings") return t;
        return "sections";
    })();
    const setActiveTab = (tab: WorkspaceTab) => {
        const next = new URLSearchParams(searchParams);
        next.set("tab", tab);
        setSearchParams(next, { replace: true });
    };
    const [sections, setSections] = useState<WorkspaceSection[]>([]);
    const [projects, setProjects] = useState<WorkspaceProject[]>([]);
    const [apiProjects, setApiProjects] = useState<DoctorCourseProject[]>([]);
    const [projectTeamCounts, setProjectTeamCounts] = useState<Record<number, number>>({});
    const [showCreateSection, setShowCreateSection] = useState(false);
    const [openedTeamProjectId, setOpenedTeamProjectId] = useState<number | null>(null);
    const [teamMessages, setTeamMessages] = useState<
        { id: number; sender: string; text: string }[]
    >([{ id: 1, sender: "Mohammad", text: "Hello team!" }]);
    const [teamChatInput, setTeamChatInput] = useState("");
    const [courseSettings, setCourseSettings] = useState<CourseWorkspaceSettingsForm>(defaultCourseWorkspaceSettings);
    const [courseHeader, setCourseHeader] = useState<CourseHeaderMeta>(() => readCourseHeaderMeta(courseId));
    const [copiedCode, setCopiedCode] = useState(false);
    const [creatingSection, setCreatingSection] = useState(false);
    const { showToast } = useToast();
    const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const role = (localStorage.getItem("role") ?? "").toLowerCase();
    const isDoctor = role === "doctor";

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
                        students: normalizeSectionStudents((s as unknown as { students?: unknown }).students),
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
        const backendId = parseBackendCourseId(courseId);
        if (backendId == null || apiProjects.length === 0) {
            setProjectTeamCounts({});
            return;
        }

        let cancelled = false;
        void (async () => {
            const entries = await Promise.all(
                apiProjects.map(async (project) => {
                    try {
                        const teamsRes = await getDoctorProjectTeams(backendId, project.id);
                        return [project.id, teamsRes.teamCount] as const;
                    } catch {
                        return [project.id, 0] as const;
                    }
                }),
            );

            if (cancelled) return;
            setProjectTeamCounts(Object.fromEntries(entries));
        })();

        return () => {
            cancelled = true;
        };
    }, [courseId, apiProjects]);

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
                    students: normalizeSectionStudents((created as unknown as { students?: unknown }).students),
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

    const teamMembers = [
        { id: 1, name: "Mohammad", role: "Leader" },
        { id: 2, name: "Ahmad", role: "Member" },
    ];

    const handleSendTeamMessage = () => {
        const text = teamChatInput.trim();
        if (!text) return;
        setTeamMessages((prev) => [...prev, { id: Date.now(), sender: "You", text }]);
        setTeamChatInput("");
    };

    return (
        <DoctorSubpageLayout
            wide
            backTo="/doctor-dashboard?section=courses"
            backLabel="All courses"
        >
            <DoctorHubPageHeader
                eyebrow={courseHeader.code}
                title={courseHeader.name}
                description="Manage sections, projects, and course settings from this workspace."
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                            {courseHeader.code}
                        </Badge>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => void copyCourseCode()}
                            aria-label={`Copy course code ${courseHeader.code}`}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        {copiedCode ? (
                            <span className="text-xs font-medium text-primary">Copied</span>
                        ) : null}
                    </div>
                }
            />

            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as WorkspaceTab)}
                className="mt-2"
            >
                <TabsList>
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <TabsTrigger key={id} value={id} className="gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="sections" className="mt-6">
                    <CourseWorkspaceSectionsPanel
                        courseId={courseId}
                        sections={sections}
                        createOpen={showCreateSection}
                        onCreateOpenChange={setShowCreateSection}
                        creatingSection={creatingSection}
                        onAddSection={(payload) => void handleAddSection(payload)}
                    />
                </TabsContent>

                <TabsContent value="projects" className="mt-6">
                    <CourseWorkspaceProjectsPanel
                        courseId={courseId}
                        isDoctor={isDoctor}
                        apiProjects={apiProjects}
                        localProjects={projects}
                        projectTeamCounts={projectTeamCounts}
                        openedTeamProjectId={openedTeamProjectId}
                        onOpenedTeamProjectIdChange={setOpenedTeamProjectId}
                        teamMembers={teamMembers}
                        teamMessages={teamMessages}
                        teamChatInput={teamChatInput}
                        onTeamChatInputChange={setTeamChatInput}
                        onSendTeamMessage={handleSendTeamMessage}
                        onCreateProject={openCreateProject}
                    />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
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
                </TabsContent>
            </Tabs>
        </DoctorSubpageLayout>
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