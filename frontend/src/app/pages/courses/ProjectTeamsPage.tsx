import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Users } from "lucide-react";
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
    const [teamSize, setTeamSize] = useState<number | null>(null);

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
                        Doctor Management
                    </p>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: dash.fontDisplay, lineHeight: 1.25 }}>
                        Project Teams
                    </h1>
                    <p style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 600, color: dash.muted, lineHeight: 1.45 }}>
                        {projectName}
                    </p>
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={S.metaChip}>
                            <strong style={{ color: dash.text }}>Section:</strong>{" "}
                            {st?.sectionName?.trim() ? st.sectionName.trim() : "—"}
                        </span>
                        <span style={S.metaChip}>
                            <strong style={{ color: dash.text }}>Team size:</strong> {teamSize ?? "—"}
                        </span>
                    </div>
                </header>

                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        style={{ ...S.primaryBtn, opacity: backendProjectId == null ? 0.6 : 1 }}
                        onClick={() => {
                            if (backendProjectId == null) return;
                            navigate(`/doctor/projects/${backendProjectId}/teams`);
                        }}
                        disabled={backendProjectId == null}
                    >
                        Assign Teams
                    </button>
                </div>

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
            </div>
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
};