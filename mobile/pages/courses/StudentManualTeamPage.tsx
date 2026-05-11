import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
    getManualTeamStudents,
    sendManualTeamRequest,
    type ManualTeamStudent,
} from "../../../api/studentCoursesApi";
import { useToast } from "../../../context/ToastContext";

export default function StudentManualTeamPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { courseId, projectId } = useParams<{ courseId?: string; projectId?: string }>();

    const safeCourseId = Number(courseId ?? 0);
    const safeProjectId = Number(projectId ?? 0);
    const navState = location.state as { projectTitle?: string } | null;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projectTitle, setProjectTitle] = useState<string>(navState?.projectTitle?.trim() || "");
    const [students, setStudents] = useState<ManualTeamStudent[]>([]);
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
                const data = await getManualTeamStudents(safeCourseId, safeProjectId);
                if (cancelled) return;
                setProjectTitle((prev) => prev || data.projectTitle || `Project #${safeProjectId}`);
                setStudents(data.students ?? []);
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
        () => projectTitle || `Project #${safeProjectId || "—"}`,
        [projectTitle, safeProjectId],
    );

    const handleSendRequest = async (studentId: number) => {
        if (!safeCourseId || !safeProjectId || sendingToId != null) return;
        setSendingToId(studentId);
        try {
            const res = await sendManualTeamRequest(safeCourseId, safeProjectId, studentId);
            setStudents((prev) =>
                prev.map((s) =>
                    s.id === studentId ? { ...s, hasPendingRequest: true } : s,
                ),
            );
            showToast(res.message || "Request sent successfully.", "success");
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
                    onClick={() => navigate(`/student/courses/${safeCourseId}/projects/${safeProjectId}/team-choice`, { state: { projectTitle: pageTitle } })}
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <header style={S.headerCard}>
                    <h1 style={S.title}>{pageTitle}</h1>
                    <p style={S.subtitle}>Choose teammates and send invitations</p>
                </header>

                <section style={S.mainCard}>
                    {loading ? <p style={S.note}>Loading available students...</p> : null}
                    {error ? <p style={S.error}>{error}</p> : null}

                    {!loading && !error && students.length === 0 ? (
                        <div style={S.emptyState}>
                            <Users size={20} color="#94a3b8" />
                            <p style={S.emptyTitle}>No available students right now.</p>
                            <p style={S.emptyText}>
                                You can come back later to send teammate requests.
                            </p>
                        </div>
                    ) : null}

                    {!loading && !error && students.length > 0 ? (
                        <div style={S.grid}>
                            {students.map((student) => {
                                const isSending = sendingToId === student.id;
                                return (
                                    <article key={student.id} style={S.card}>
                                        <div style={S.cardTop}>
                                            {renderAvatar(student)}
                                            <div style={{ minWidth: 0 }}>
                                                <p style={S.name}>{student.name}</p>
                                                <p style={S.email}>{student.email || "No email"}</p>
                                            </div>
                                            <span style={S.sectionBadge}>{student.sectionName || "Section"}</span>
                                        </div>

                                        {student.bio ? <p style={S.bio}>{student.bio}</p> : null}

                                        <div style={S.skillsWrap}>
                                            {student.skills.length === 0 ? (
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
                                            {student.availabilityStatus === "already_teammate" ? (
                                                <span style={S.alreadyBadge}>Already In Team</span>
                                            ) : student.availabilityStatus === "unavailable" ? (
                                                <button
                                                    type="button"
                                                    style={{ ...S.requestBtn, ...S.requestBtnDisabled }}
                                                    disabled
                                                >
                                                    Unavailable
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    style={{
                                                        ...S.requestBtn,
                                                        ...(student.hasPendingRequest ? S.requestBtnDisabled : null),
                                                    }}
                                                    disabled={student.hasPendingRequest || isSending || student.availabilityStatus !== "available"}
                                                    onClick={() => void handleSendRequest(student.id)}
                                                >
                                                    {isSending
                                                        ? "Sending..."
                                                        : student.hasPendingRequest
                                                            ? "Request Sent"
                                                            : "Send Invitation"}
                                                </button>
                                            )}
                                        </div>
                                        {student.availabilityStatus === "unavailable" ? (
                                            <span style={S.unavailableBadge}>{student.availabilityReason}</span>
                                        ) : null}
                                        {student.availabilityStatus === "already_teammate" ? (
                                            <span style={S.alreadyBadge}>Already In Your Team</span>
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

function renderAvatar(student: ManualTeamStudent) {
    const raw = student.avatar?.trim();
    const nameInitial = (student.name || "?").charAt(0).toUpperCase();
    const src = !raw
        ? null
        : raw.startsWith("data:")
            ? raw
            : `data:image/*;base64,${raw}`;

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
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "8px 0 0", fontSize: 14, color: "#6b7280" },
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
    emptyState: {
        marginTop: 8,
        padding: "18px 14px",
        borderRadius: 12,
        background: "#f8fafc",
        border: "1px dashed #d1d5db",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 6,
    },
    emptyTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "#6b7280" },
    emptyText: { margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
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
        marginLeft: "auto",
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
