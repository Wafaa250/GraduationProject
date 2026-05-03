import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, RotateCw, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";
import api from "../../../api/axiosInstance";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type TeamsLocationState = {
    projectName?: string;
    projectId?: number;
    sectionName?: string;
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
    const [teamSize, setTeamSize] = useState<number | null>(null);

    // ── Load saved teams (GET) ─────────────────────────────────────────────────
    const loadSavedTeams = useCallback(async () => {
        if (backendCourseId == null || backendProjectId == null) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<GenerateTeamsResponse>(
                `/courses/${backendCourseId}/projects/${backendProjectId}/teams`
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

    useEffect(() => {
        void loadSavedTeams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    <p style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 600, color: dash.muted }}>{projectName}</p>
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={S.metaChip}><strong style={{ color: dash.text }}>Section:</strong> {st?.sectionName?.trim() || "—"}</span>
                        <span style={S.metaChip}><strong style={{ color: dash.text }}>Team size:</strong> {teamSize ?? "—"}</span>
                        <span style={S.metaChip}><strong style={{ color: dash.text }}>Teams:</strong> {teams.length > 0 ? teams.length : "—"}</span>
                    </div>
                </header>

                {/* Actions */}
                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                        type="button"
                        style={{ ...S.secondaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}
                        onClick={() => void fetchTeams()}
                        disabled={loading || backendProjectId == null}
                    >
                        <RotateCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                        Regenerate
                    </button>
                </div>

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
                            Project was not saved yet — please create the project first.
                        </p>
                    </div>
                )}

                {/* Teams grid */}
                {!loading && !error && teams.length > 0 && (
                    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                        {teams.map((team) => (
                            <article key={team.teamIndex} style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                                {/* Team header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: dash.text }}>
                                        Team {team.teamIndex + 1}
                                    </h2>
                                    <span style={S.countChip}>
                                        <Users size={12} />
                                        {team.memberCount}
                                    </span>
                                </div>

                                {/* Members */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {team.members.map((member) => (
                                        <div key={member.studentId} style={S.memberRow}>
                                            <div style={S.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: dash.text }}>{member.name}</p>
                                                {member.skills.length > 0 && (
                                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: dash.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {member.skills.slice(0, 3).join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={S.scoreBadge}>{member.matchScore.toFixed(0)}%</span>
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
                            No teams generated yet. Click <strong>Regenerate</strong> to start.
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
        padding: "9px 16px", borderRadius: 10, border: `1px solid ${dash.border}`,
        background: dash.surface, color: dash.muted, fontSize: 13, fontWeight: 700,
        cursor: "pointer", fontFamily: dash.font,
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
};