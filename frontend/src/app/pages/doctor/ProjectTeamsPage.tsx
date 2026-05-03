import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, RotateCw, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axiosInstance";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type LocationState = {
    courseId?: number;
    projectName?: string;
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

export default function DoctorProjectTeamsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = useParams<{ projectId: string }>();
    const { showToast } = useToast();

    const st = location.state as LocationState | null;
    const courseId   = st?.courseId ?? null;
    const projectName = st?.projectName ?? `Project #${projectId ?? "—"}`;

    const backHref = courseId ? `/courses/${courseId}` : "/doctor-dashboard";

    // ── State ──────────────────────────────────────────────────────────────────
    const [teams, setTeams]       = useState<GeneratedTeam[]>([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [teamSize, setTeamSize] = useState<number | null>(null);
    const [title, setTitle]       = useState<string>(projectName);

    // ── Load saved teams (GET) ─────────────────────────────────────────────────
    const loadSavedTeams = useCallback(async () => {
        if (!courseId || !projectId) {
            setError("Missing course or project ID.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<GenerateTeamsResponse>(
                `/courses/${courseId}/projects/${projectId}/teams`
            );
            setTeams(res.data.teams);
            setTeamSize(res.data.teamSize);
            setTitle(res.data.projectTitle || projectName);
        } catch (err) {
            const msg = parseApiErrorMessage(err);
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [courseId, projectId, projectName, showToast]);

    // ── Regenerate teams (POST) ────────────────────────────────────────────────
    const fetchTeams = useCallback(async () => {
        if (!courseId || !projectId) {
            setError("Missing course or project ID.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.post<GenerateTeamsResponse>(
                `/courses/${courseId}/projects/${projectId}/generate-teams`
            );
            setTeams(res.data.teams);
            setTeamSize(res.data.teamSize);
            setTitle(res.data.projectTitle || projectName);
        } catch (err) {
            const msg = parseApiErrorMessage(err);
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [courseId, projectId, projectName, showToast]);

    useEffect(() => {
        void loadSavedTeams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div style={S.page}>
            <div style={{ maxWidth: 1040, margin: "0 auto" }}>

                <button type="button" onClick={() => navigate(backHref)} style={S.backBtn}>
                    <ArrowLeft size={16} />
                    Back to course
                </button>

                <header style={S.headerCard}>
                    <div style={S.headerRow}>
                        <div>
                            <h1 style={S.title}>Project Teams</h1>
                            <p style={S.subtitle}>{title}</p>
                            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                                {teamSize != null && (
                                    <span style={S.chip}>Team size: <strong>{teamSize}</strong></span>
                                )}
                                {teams.length > 0 && (
                                    <span style={S.chip}>Teams: <strong>{teams.length}</strong></span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            style={{ ...S.globalRegenerateBtn, opacity: loading ? 0.7 : 1 }}
                            onClick={() => void fetchTeams()}
                            disabled={loading}
                        >
                            <RotateCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                            Regenerate All Teams
                        </button>
                    </div>
                </header>

                {/* Loading */}
                {loading && (
                    <div style={{ ...S.headerCard, marginTop: 16, padding: "40px 24px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>Generating teams with AI…</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div style={{ ...S.headerCard, marginTop: 16, padding: "24px", background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#be123c" }}>{error}</p>
                    </div>
                )}

                {/* No courseId */}
                {!loading && !error && !courseId && (
                    <div style={{ ...S.headerCard, marginTop: 16, padding: "40px 24px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                            Please navigate here from the course workspace.
                        </p>
                    </div>
                )}

                {/* Teams grid */}
                {!loading && !error && teams.length > 0 && (
                    <div style={S.grid}>
                        {teams.map((team) => (
                            <article key={team.teamIndex} style={S.card}>
                                <div style={S.cardHead}>
                                    <h2 style={S.teamName}>Team {String.fromCharCode(65 + team.teamIndex)}</h2>
                                    <span style={S.countChip}>
                                        <Users size={12} />
                                        {team.memberCount}
                                    </span>
                                </div>

                                <div style={S.membersList}>
                                    {team.members.map((member) => (
                                        <div key={member.studentId} style={S.memberRow}>
                                            <div style={S.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={S.memberName}>{member.name}</p>
                                                {member.skills.length > 0 && (
                                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {member.skills.slice(0, 3).join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={S.scoreBadge}>{member.matchScore.toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={S.actions}>
                                    <button
                                        type="button"
                                        style={S.secondaryBtn}
                                        onClick={() => navigate(`/doctor/projects/${projectId}/teams/${team.teamIndex}`, {
                                            state: { courseId, projectName: title }
                                        })}
                                    >
                                        Manage Team
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && teams.length === 0 && courseId && (
                    <div style={{ ...S.headerCard, marginTop: 16, padding: "40px 24px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                            No teams yet. Click <strong>Regenerate All Teams</strong> to generate.
                        </p>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const S: Record<string, CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "24px 28px 40px",
    },
    backBtn: {
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px",
        borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff",
        color: "#334155", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    },
    headerCard: {
        marginTop: 14, border: "1px solid #e2e8f0", borderRadius: 14,
        background: "#fff", padding: 18, boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    headerRow: {
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap",
    },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },
    chip: {
        display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px",
        borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
        fontSize: 12, color: "#64748b",
    },
    globalRegenerateBtn: {
        border: "none", borderRadius: 10,
        background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
        color: "#fff", fontSize: 12, fontWeight: 700, padding: "9px 14px",
        cursor: "pointer", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 8,
    },
    grid: {
        marginTop: 16,
        display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14,
    },
    card: {
        border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff",
        padding: 14, boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
        display: "flex", flexDirection: "column", gap: 12,
    },
    cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
    teamName: { margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" },
    countChip: {
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, fontWeight: 700, color: "#6d28d9",
        background: "#f3e8ff", border: "1px solid #e9d5ff",
        borderRadius: 999, padding: "4px 8px",
    },
    membersList: { display: "flex", flexDirection: "column", gap: 8 },
    memberRow: {
        display: "flex", alignItems: "center", gap: 10,
        border: "1px solid #e2e8f0", borderRadius: 10,
        background: "#f8fafc", padding: "8px 10px",
    },
    avatar: {
        width: 30, height: 30, borderRadius: "50%",
        background: "#ddd6fe", color: "#6d28d9",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, flexShrink: 0,
    },
    memberName: { margin: 0, fontSize: 13, fontWeight: 600, color: "#1f2937" },
    scoreBadge: {
        fontSize: 11, fontWeight: 800, color: "#6d28d9",
        background: "#f3e8ff", border: "1px solid #e9d5ff",
        borderRadius: 999, padding: "3px 8px", flexShrink: 0,
    },
    actions: { marginTop: 4, display: "flex", justifyContent: "flex-end" },
    secondaryBtn: {
        border: "1px solid #d1d5db", borderRadius: 9, background: "#fff",
        color: "#334155", fontSize: 12, fontWeight: 700,
        padding: "8px 11px", cursor: "pointer", fontFamily: "inherit",
    },
};
