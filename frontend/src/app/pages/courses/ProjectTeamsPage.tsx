import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import axios from "axios";
import { ArrowLeft, MessageCircle, RotateCw, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";
import api from "../../../api/axiosInstance";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
    getDoctorCourseProjects,
    openCourseTeamConversation,
    type DoctorCourseProject,
} from "../../../api/doctorCoursesApi";
import { useToast } from "../../../context/ToastContext";

function sectionLabelFromProject(p: DoctorCourseProject): string {
    if (p.applyToAllSections) return "All sections";
    const names = p.sections.map((s) => s.sectionName.trim()).filter((n) => n.length > 0);
    if (names.length === 0) return "—";
    return names.join(", ");
}

// ── Types ──────────────────────────────────────────────────────────────────────

type TeamsLocationState = {
    projectName?: string;
    projectId?: number;
    sectionName?: string;
    /** Optional; set when navigating from course workspace with explicit course id in state. */
    courseId?: number;
};

type GeneratedMember = {
    studentId: number;
    userId: number;
    name: string;
    matchScore: number;
    skills: string[];
};

type GeneratedTeam = {
    /** DB id from API — use for stable React keys across projects */
    teamId?: number;
    teamIndex: number;
    memberCount: number;
    members: GeneratedMember[];
};

type GenerateTeamsResponse = {
    projectId: number;
    projectTitle: string;
    teamSize: number;
    teamCount: number;
    teams: GeneratedTeam[];
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProjectTeamsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { courseId, projectId } = useParams<{ courseId: string; projectId: string }>();
    const { showToast } = useToast();

    const st = location.state as TeamsLocationState | null;

    const projectName = useMemo(() => {
        const n = st?.projectName?.trim();
        return n && n.length > 0 ? n : "Project";
    }, [st]);

    // Use projectId from route params; fall back to location state for temp routes
    const backendProjectId = useMemo(() => {
        if (projectId && /^\d+$/.test(projectId)) return Number(projectId);
        if (st?.projectId) return st.projectId;
        return null;
    }, [projectId, st]);

    const backendCourseId = useMemo(() => {
        if (courseId && /^\d+$/.test(courseId)) return Number(courseId);
        const fromState = st?.courseId;
        if (typeof fromState === "number" && Number.isFinite(fromState) && fromState > 0) return fromState;
        return null;
    }, [courseId, st]);

    const backHref = courseId ? `/courses/${courseId}` : "/doctor-dashboard";

    // ── State ──────────────────────────────────────────────────────────────────
    const [teams, setTeams] = useState<GeneratedTeam[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teamSize, setTeamSize] = useState<number | null>(null);
    /** Filled from API so Section / title survive refresh and second visits (no location.state). */
    const [projectMeta, setProjectMeta] = useState<{
        title: string;
        sectionLabel: string;
        aiMode: "doctor" | "student";
    } | null>(null);
    const [openingChatTeamId, setOpeningChatTeamId] = useState<number | null>(null);

    // ── Regenerate teams (POST) ────────────────────────────────────────────────
    const fetchTeams = useCallback(async () => {
        if (backendCourseId == null || backendProjectId == null) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.post<GenerateTeamsResponse>(
                `/courses/${backendCourseId}/projects/${backendProjectId}/generate-teams`
            );
            setTeams(res.data.teams);
            setTeamSize(res.data.teamSize);
        } catch (err) {
            const msg = parseApiErrorMessage(err);
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [backendCourseId, backendProjectId, showToast]);

    // Load saved teams per (course, project). Clear stale UI + abort in-flight GET when switching projects.
    useEffect(() => {
        if (backendCourseId == null || backendProjectId == null) {
            setTeams([]);
            setTeamSize(null);
            setProjectMeta(null);
            return;
        }

        const ac = new AbortController();
        setTeams([]);
        setTeamSize(null);
        setProjectMeta(null);
        setError(null);
        setLoading(true);

        void (async () => {
            try {
                const res = await api.get<GenerateTeamsResponse>(
                    `/courses/${backendCourseId}/projects/${backendProjectId}/teams`,
                    { signal: ac.signal },
                );
                if (ac.signal.aborted) return;

                let meta: DoctorCourseProject | undefined;
                try {
                    const projects = await getDoctorCourseProjects(backendCourseId);
                    if (!ac.signal.aborted) {
                        meta = projects.find((p) => p.id === backendProjectId);
                        if (meta) {
                            setProjectMeta({
                                title: meta.title.trim() || "Project",
                                sectionLabel: sectionLabelFromProject(meta),
                                aiMode: meta.aiMode,
                            });
                        }
                    }
                } catch {
                    /* section/title from navigation state only */
                }

                setTeams(res.data.teams);
                setTeamSize(res.data.teamSize);

                const hasSavedTeams =
                    (res.data.teams?.length ?? 0) > 0 || (res.data.teamCount ?? 0) > 0;
                if (hasSavedTeams) return;

                if (!meta || meta.aiMode !== "doctor") return;

                const gen = await api.post<GenerateTeamsResponse>(
                    `/courses/${backendCourseId}/projects/${backendProjectId}/generate-teams`,
                    null,
                    { signal: ac.signal },
                );
                if (ac.signal.aborted) return;
                setTeams(gen.data.teams);
                setTeamSize(gen.data.teamSize);
            } catch (err) {
                if (ac.signal.aborted) return;
                if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") return;
                const msg = parseApiErrorMessage(err);
                setError(msg);
                showToast(msg, "error");
            } finally {
                if (!ac.signal.aborted) setLoading(false);
            }
        })();

        return () => ac.abort();
    }, [backendCourseId, backendProjectId, showToast]);

    const openTeamChat = useCallback(async (teamId: number) => {
        setOpeningChatTeamId(teamId);
        try {
            const { conversationId } = await openCourseTeamConversation(teamId);
            navigate("/messages", { state: { conversationId } });
        } catch (err) {
            const msg = parseApiErrorMessage(err);
            showToast(msg, "error");
        } finally {
            setOpeningChatTeamId(null);
        }
    }, [navigate, showToast]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", background: dash.bg, fontFamily: dash.font, color: dash.text, padding: "24px 28px 40px" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                <button type="button" onClick={() => navigate(backHref)} style={S.backBtn}>
                    <ArrowLeft size={18} />
                    Back to course
                </button>

                <header style={{ ...card, padding: "22px 24px", marginTop: 20 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Doctor Management
                    </p>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: dash.fontDisplay, lineHeight: 1.25 }}>
                        Project Teams
                    </h1>
                    <p style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 600, color: dash.muted, lineHeight: 1.45 }}>
                        {projectMeta?.title?.trim() || projectName}
                    </p>
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={S.metaChip}>
                            <strong style={{ color: dash.text }}>Section:</strong>{" "}
                            {projectMeta?.sectionLabel?.trim()
                                ? projectMeta.sectionLabel.trim()
                                : st?.sectionName?.trim()
                                  ? st.sectionName.trim()
                                  : "—"}
                        </span>
                        <span style={S.metaChip}><strong style={{ color: dash.text }}>Team size:</strong> {teamSize ?? "—"}</span>
                        <span style={S.metaChip}><strong style={{ color: dash.text }}>Teams:</strong> {teams.length > 0 ? teams.length : "—"}</span>
                    </div>
                </header>

                {/* Actions */}
                {projectMeta?.aiMode === "doctor" ? (
                    <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                        <button
                            type="button"
                            style={{ ...S.secondaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}
                            onClick={() => void fetchTeams()}
                            disabled={loading || backendProjectId == null}
                        >
                            <RotateCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                            Regenerate
                        </button>
                        <button
                            type="button"
                            style={{ ...S.primaryBtn, opacity: backendProjectId == null ? 0.6 : 1 }}
                            onClick={() => {
                                if (courseId == null) return;
                                navigate(`/courses/${courseId}`);
                            }}
                            disabled={backendProjectId == null}
                        >
                            Assign Teams
                        </button>
                    </div>
                ) : null}

                {/* Loading */}
                {loading && (
                    <div style={{ ...card, marginTop: 20, padding: "48px 24px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, color: dash.muted }}>Generating teams with AI…</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div style={{ ...card, marginTop: 20, padding: "24px", background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: dash.danger }}>{error}</p>
                    </div>
                )}

                {/* No project id */}
                {!loading && !error && backendProjectId == null && (
                    <div style={{ ...card, marginTop: 20, padding: "48px 24px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, color: dash.muted }}>
                            Project was not saved yet — please create the project first and try again.
                        </p>
                    </div>
                )}

                {/* Teams grid */}
                {!loading && !error && teams.length > 0 && (
                    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                        {teams.map((team) => (
                            <article
                                key={`${backendProjectId}-${team.teamId ?? team.teamIndex}`}
                                style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}
                            >
                                {/* Team header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: dash.text }}>
                                            Team {team.teamIndex + 1}
                                        </h2>
                                        <button
                                            type="button"
                                            style={S.openChatBtn}
                                            disabled={!team.teamId || openingChatTeamId === team.teamId}
                                            title="Open Team Chat"
                                            onClick={() => team.teamId && void openTeamChat(team.teamId)}
                                        >
                                            <MessageCircle size={13} />
                                            Open Team Chat
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        {projectMeta?.aiMode === "student" ? <span style={S.manualBadge}>Manual Team</span> : null}
                                        <span style={S.countChip}>
                                            <Users size={12} />
                                            {team.memberCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Members */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {team.members.map((member) => (
                                        <div
                                            key={`${team.teamId ?? team.teamIndex}-${member.studentId}`}
                                            style={S.memberRow}
                                        >
                                            <div style={S.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: dash.text }}>{member.name}</p>
                                                {member.skills.length > 0 && (
                                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: dash.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {member.skills.slice(0, 3).join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                            {projectMeta?.aiMode === "student"
                                                ? null
                                                : <span style={S.scoreBadge}>{member.matchScore.toFixed(0)}%</span>}
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* No teams yet */}
                {!loading && !error && teams.length === 0 && backendProjectId != null && (
                    <div style={{ ...card, marginTop: 20, padding: "48px 24px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, color: dash.muted }}>
                            {projectMeta?.aiMode === "student"
                                ? "No teams created yet. Students can form teams by invitations."
                                : "No teams generated yet. Click Regenerate to start."}
                        </p>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const S: Record<string, CSSProperties> = {
    backBtn: {
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
        borderRadius: 10, border: `1px solid ${dash.border}`, background: dash.surface,
        color: dash.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: dash.font,
    },
    secondaryBtn: {
        display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px",
        borderRadius: 10, border: `1px solid ${dash.border}`, background: dash.surface,
        color: dash.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: dash.font,
    },
    primaryBtn: {
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px",
        borderRadius: 10, border: "none", background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
        color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: dash.font,
        boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
    },
    metaChip: {
        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px",
        borderRadius: 8, border: `1px solid ${dash.border}`, background: dash.surface,
        color: dash.muted, fontSize: 12, fontWeight: 600, fontFamily: dash.font,
    },
    countChip: {
        display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
        color: dash.accent, background: dash.accentMuted, border: `1px solid #c7d2fe`,
        borderRadius: 999, padding: "4px 8px",
    },
    memberRow: {
        display: "flex", alignItems: "center", gap: 10,
        border: `1px solid ${dash.border}`, borderRadius: 10,
        background: dash.surface, padding: "8px 10px",
    },
    avatar: {
        width: 32, height: 32, borderRadius: "50%",
        background: dash.accentMuted, color: dash.accent,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, flexShrink: 0,
    },
    scoreBadge: {
        fontSize: 11, fontWeight: 800, color: dash.accent,
        background: dash.accentMuted, border: `1px solid #c7d2fe`,
        borderRadius: 999, padding: "3px 8px", flexShrink: 0,
    },
    manualBadge: {
        display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 800,
        color: "#7c2d12", background: "#ffedd5", border: "1px solid #fed7aa",
        borderRadius: 999, padding: "3px 8px",
    },
    openChatBtn: {
        display: "inline-flex", alignItems: "center", gap: 6,
        border: "1px solid #c4b5fd", background: "#f5f3ff", color: "#6d28d9",
        borderRadius: 999, padding: "5px 9px", cursor: "pointer",
        fontSize: 11, fontWeight: 800, fontFamily: dash.font,
    },
};
