import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";
import api from "../../../api/axiosInstance";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type TeamsLocationState = {
    projectName?: string;
    projectId?: number;
};

type GeneratedMember = {
    studentId: number;
    userId: number;
    name: string;
    matchScore: number;
    skills: string[];
};

type GeneratedTeam = {
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
        return null;
    }, [courseId]);

    const backHref = courseId ? `/courses/${courseId}` : "/doctor-dashboard";

    // ── State ──────────────────────────────────────────────────────────────────
    const [teams, setTeams] = useState<GeneratedTeam[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Fetch teams ────────────────────────────────────────────────────────────
    const fetchTeams = useCallback(async () => {
        if (backendCourseId == null || backendProjectId == null) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.post<GenerateTeamsResponse>(
                `/courses/${backendCourseId}/projects/${backendProjectId}/generate-teams`
            );
            setTeams(res.data.teams);
        } catch (err) {
            const msg = parseApiErrorMessage(err);
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [backendCourseId, backendProjectId, showToast]);

    useEffect(() => {
        void fetchTeams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Render ─────────────────────────────────────────────────────────────────
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
                <button type="button" onClick={() => navigate(backHref)} style={S.backBtn}>
                    <ArrowLeft size={18} />
                    Back to course
                </button>

                <header style={{ ...card, padding: "22px 24px", marginTop: 20 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Preview
                    </p>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: dash.fontDisplay, lineHeight: 1.25 }}>
                        AI Generated Teams
                    </h1>
                    <p style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 600, color: dash.muted, lineHeight: 1.45 }}>
                        {projectName}
                    </p>
                </header>

                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        style={{ ...S.secondaryBtn, opacity: loading ? 0.6 : 1 }}
                        onClick={() => void fetchTeams()}
                        disabled={loading}
                    >
                        <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : undefined }} />
                        {loading ? "Generating…" : "Regenerate teams"}
                    </button>
                </div>

                {/* Loading state */}
                {loading && teams.length === 0 && (
                    <div style={{ ...card, marginTop: 20, padding: "48px 24px", textAlign: "center" }}>
                        <RefreshCw size={32} color={dash.accent} style={{ animation: "spin 1s linear infinite", marginBottom: 14 }} />
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.muted }}>
                            AI is forming teams based on student skills…
                        </p>
                    </div>
                )}

                {/* Error / no backend id */}
                {!loading && error && (
                    <div style={{ ...card, marginTop: 20, padding: "24px", background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: dash.danger }}>{error}</p>
                    </div>
                )}

                {/* No project id (temp route) */}
                {!loading && !error && backendProjectId == null && (
                    <div style={{ ...card, marginTop: 20, padding: "48px 24px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, color: dash.muted }}>
                            Project was not saved yet — please create the project first and try again.
                        </p>
                    </div>
                )}

                {/* Teams grid */}
                {teams.length > 0 && (
                    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                        {teams.map((team) => (
                            <article
                                key={team.teamIndex}
                                style={{ ...card, padding: "20px 18px 18px", boxShadow: dash.shadow, display: "flex", flexDirection: "column", gap: 14 }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: dash.fontDisplay, color: dash.text, lineHeight: 1.25 }}>
                                        Team {team.teamIndex}
                                    </h2>
                                    <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: dash.accentMuted, color: dash.accent, border: "1px solid #c7d2fe" }}>
                                        <Users size={13} />
                                        {team.memberCount}
                                    </span>
                                </div>

                                <div>
                                    <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
                                        MEMBERS
                                    </p>
                                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                                        {team.members.map((m) => (
                                            <li key={m.studentId} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: dash.text }}>{m.name}</span>
                                                {m.skills.length > 0 && (
                                                    <span style={{ fontSize: 11, color: dash.subtle, lineHeight: 1.4 }}>
                                                        {m.skills.slice(0, 3).join(", ")}
                                                        {m.skills.length > 3 ? ` +${m.skills.length - 3}` : ""}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
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
};