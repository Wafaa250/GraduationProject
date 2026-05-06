import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
    getAiTeamRecommendations,
    sendManualTeamRequest,
    type AiTeamRecommendation,
} from "../../../api/studentCoursesApi";
import { useToast } from "../../../context/ToastContext";

export default function StudentAiTeamPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { courseId, projectId } = useParams<{ courseId?: string; projectId?: string }>();

    const safeCourseId = Number(courseId ?? 0);
    const safeProjectId = Number(projectId ?? 0);
    const navState = location.state as { projectTitle?: string } | null;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<AiTeamRecommendation[]>([]);
    const [sendingToId, setSendingToId] = useState<number | null>(null);

    useEffect(() => {
        if (!safeCourseId || !safeProjectId) {
            setError("Invalid course/project route.");
            setLoading(false);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAiTeamRecommendations(safeCourseId, safeProjectId);
                if (cancelled) return;
                setRecommendations(data ?? []);
            } catch (err) {
                if (cancelled) return;
                setError(parseApiErrorMessage(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [safeCourseId, safeProjectId]);

    const pageTitle = useMemo(
        () => navState?.projectTitle?.trim() || `Project #${safeProjectId || "—"}`,
        [navState?.projectTitle, safeProjectId],
    );

    const handleSendInvitation = async (studentId: number) => {
        if (!safeCourseId || !safeProjectId || sendingToId != null) return;
        setSendingToId(studentId);
        try {
            const res = await sendManualTeamRequest(safeCourseId, safeProjectId, studentId);
            setRecommendations((prev) =>
                prev.map((r) =>
                    r.studentId === studentId ? { ...r, hasPendingRequest: true, availabilityStatus: "pending" } : r,
                ),
            );
            showToast(res.message || "Invitation sent.", "success");
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setSendingToId(null);
        }
    };

    return (
        <div style={S.page}>
            <div style={S.container}>
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/student/courses/${safeCourseId}/projects/${safeProjectId}/team-choice`,
                            { state: { projectTitle: pageTitle } },
                        )
                    }
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <header style={S.headerCard}>
                    <div style={S.headerIconWrap}>
                        <Sparkles size={22} color="#6d28d9" />
                    </div>
                    <h1 style={S.title}>{pageTitle}</h1>
                    <p style={S.subtitle}>
                        AI-ranked suggestions — you still choose who to invite; invitations use the same flow as manual
                        browse.
                    </p>
                </header>

                <section style={S.mainCard}>
                    {loading ? <p style={S.note}>Loading recommendations...</p> : null}
                    {error ? <p style={S.error}>{error}</p> : null}

                    {!loading && !error && recommendations.length === 0 ? (
                        <p style={S.note}>No eligible students to recommend right now.</p>
                    ) : null}

                    {!loading && !error && recommendations.length > 0 ? (
                        <div style={S.grid}>
                            {recommendations.map((student) => {
                                const isSending = sendingToId === student.studentId;
                                const status = student.availabilityStatus;
                                const canInvite =
                                    status === "available" &&
                                    !student.hasPendingRequest &&
                                    !student.isAlreadyInTeam;
                                const matchPct = Math.min(100, Math.max(0, Math.round(student.matchScore)));

                                return (
                                    <article key={student.studentId} style={S.card}>
                                        <div style={S.cardTop}>
                                            {renderAvatar(student)}
                                            <div style={{ minWidth: 0 }}>
                                                <p style={S.name}>{student.name}</p>
                                                <p style={S.email}>{student.email || "No email"}</p>
                                            </div>
                                            <span style={S.matchBadge}>{matchPct}% Match</span>
                                        </div>
                                        <span style={S.sectionBadge}>{student.sectionName || "Section"}</span>

                                        {student.matchReason ? (
                                            <p style={S.matchReason}>
                                                <span style={S.matchReasonLabel}>Why this match</span>
                                                {student.matchReason}
                                            </p>
                                        ) : null}

                                        {student.bio ? <p style={S.bio}>{student.bio}</p> : null}

                                        <div style={S.skillsWrap}>
                                            {(student.skills ?? []).length === 0 ? (
                                                <span style={S.skillTagMuted}>No skills listed</span>
                                            ) : (
                                                student.skills.map((skill) => (
                                                    <span key={skill} style={S.skillTag}>
                                                        {skill}
                                                    </span>
                                                ))
                                            )}
                                        </div>

                                        <div style={S.actionsRow}>
                                            {student.isAlreadyInTeam ? (
                                                <span style={S.alreadyBadge}>Already In Team</span>
                                            ) : student.hasPendingRequest || status === "pending" ? (
                                                <button type="button" style={{ ...S.requestBtn, ...S.requestBtnDisabled }} disabled>
                                                    Invitation Sent
                                                </button>
                                            ) : status === "unavailable" ? (
                                                <button type="button" style={{ ...S.requestBtn, ...S.requestBtnDisabled }} disabled>
                                                    Unavailable
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    style={{
                                                        ...S.requestBtn,
                                                        ...(canInvite ? null : S.requestBtnDisabled),
                                                    }}
                                                    disabled={!canInvite || isSending}
                                                    onClick={() => void handleSendInvitation(student.studentId)}
                                                >
                                                    {isSending ? "Sending..." : "Send Invitation"}
                                                </button>
                                            )}
                                        </div>
                                        {student.availabilityStatus === "unavailable" && student.availabilityReason ? (
                                            <span style={S.unavailableBadge}>{student.availabilityReason}</span>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}

function renderAvatar(student: AiTeamRecommendation) {
    const raw = student.avatar?.trim();
    const nameInitial = (student.name || "?").charAt(0).toUpperCase();
    const src = !raw ? null : raw.startsWith("data:") ? raw : `data:image/*;base64,${raw}`;

    if (src) {
        return <img src={src} alt={student.name} style={S.avatarImg} />;
    }
    return <div style={S.avatarFallback}>{nameInitial}</div>;
}

const S: Record<string, CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "24px 28px 40px",
    },
    container: {
        maxWidth: 1080,
        margin: "0 auto",
    },
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
        fontFamily: "inherit",
    },
    headerCard: {
        marginTop: 20,
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: "20px 22px",
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    headerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ede9fe",
        marginBottom: 10,
    },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "8px 0 0", fontSize: 14, color: "#6b7280", lineHeight: 1.5 },
    mainCard: {
        marginTop: 14,
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: 18,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    note: { margin: "8px 0 0", fontSize: 13, color: "#6b7280" },
    error: { margin: "8px 0 0", fontSize: 13, color: "#b91c1c", fontWeight: 600 },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
        gap: 12,
    },
    card: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: "12px 14px",
        boxShadow: "0 3px 10px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    cardTop: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    avatarImg: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid #e2e8f0",
        flexShrink: 0,
    },
    avatarFallback: {
        width: 38,
        height: 38,
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
    name: { margin: 0, fontSize: 14, fontWeight: 800, color: "#1f2937" },
    email: { margin: "3px 0 0", fontSize: 12, color: "#6b7280" },
    sectionBadge: {
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: 999,
        background: "#ede9fe",
        color: "#6d28d9",
        border: "1px solid #ddd6fe",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
    },
    matchBadge: {
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        color: "#6d28d9",
        background: "#f3e8ff",
        border: "1px solid #e9d5ff",
        whiteSpace: "nowrap",
    },
    matchReason: {
        margin: 0,
        fontSize: 12,
        color: "#475569",
        lineHeight: 1.45,
    },
    matchReasonLabel: {
        display: "block",
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#94a3b8",
        marginBottom: 4,
    },
    bio: { margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.45 },
    skillsWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
    skillTag: {
        fontSize: 11,
        fontWeight: 700,
        color: "#475569",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: 999,
        padding: "4px 8px",
    },
    skillTagMuted: {
        fontSize: 11,
        fontWeight: 600,
        color: "#94a3b8",
    },
    actionsRow: { marginTop: 4, display: "flex", justifyContent: "flex-end" },
    requestBtn: {
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
    requestBtnDisabled: {
        background: "#cbd5e1",
        boxShadow: "none",
        cursor: "not-allowed",
    },
    alreadyBadge: {
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#166534",
        background: "#dcfce7",
        border: "1px solid #bbf7d0",
        borderRadius: 999,
        padding: "4px 8px",
    },
    unavailableBadge: {
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#92400e",
        background: "#fef3c7",
        border: "1px solid #fde68a",
        borderRadius: 999,
        padding: "4px 8px",
    },
};
