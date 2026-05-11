import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Inbox } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
    acceptTeamInvitation,
    getTeamInvitations,
    rejectTeamInvitation,
    type AcceptTeamInvitationResponse,
    type TeamInvitationItem,
} from "../../../api/studentCoursesApi";
import { useToast } from "../../../context/ToastContext";

export default function StudentTeamInvitationsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<TeamInvitationItem[]>([]);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [statusById, setStatusById] = useState<Record<number, "accepted" | "rejected">>({});
    const [acceptResultByInvitationId, setAcceptResultByInvitationId] = useState<
        Record<number, AcceptTeamInvitationResponse>
    >({});
    const highlightedId = useMemo(
        () => Number((location.state as { highlightInvitationId?: number } | null)?.highlightInvitationId ?? 0),
        [location.state],
    );
    const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getTeamInvitations();
                if (!cancelled) setItems(data);
            } catch (err) {
                if (!cancelled) setError(parseApiErrorMessage(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!highlightedId) return;
        const el = cardRefs.current[highlightedId];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [highlightedId, items.length]);

    const handleAccept = async (id: number) => {
        setBusyId(id);
        try {
            const res = await acceptTeamInvitation(id);
            setAcceptResultByInvitationId((prev) => ({ ...prev, [id]: res }));
            setStatusById((prev) => ({ ...prev, [id]: "accepted" }));
            showToast("Invitation accepted. You joined the team.", "success");
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (id: number) => {
        setBusyId(id);
        try {
            const res = await rejectTeamInvitation(id);
            setStatusById((prev) => ({ ...prev, [id]: "rejected" }));
            showToast(res.message || "Invitation rejected.", "success");
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div style={S.page}>
            <div style={S.container}>
                <button type="button" onClick={() => navigate("/dashboard")} style={S.backBtn}>
                    <ArrowLeft size={16} />
                    Back
                </button>
                <header style={S.headerCard}>
                    <h1 style={S.title}>Team Invitations</h1>
                    <p style={S.subtitle}>Review and respond to manual teammate invitations</p>
                </header>

                <section style={S.mainCard}>
                    {loading ? <p style={S.note}>Loading invitations...</p> : null}
                    {error ? <p style={S.error}>{error}</p> : null}

                    {!loading && !error && items.length === 0 ? (
                        <div style={S.emptyState}>
                            <Inbox size={20} color="#94a3b8" />
                            <p style={S.emptyTitle}>No pending invitations</p>
                        </div>
                    ) : null}

                    {!loading && !error && items.length > 0 ? (
                        <div style={S.list}>
                            {items.map((item) => {
                                const busy = busyId === item.invitationId;
                                const status = statusById[item.invitationId];
                                const isHighlighted = highlightedId === item.invitationId;
                                return (
                                    <article
                                        key={item.invitationId}
                                        ref={(el) => {
                                            cardRefs.current[item.invitationId] = el;
                                        }}
                                        style={{
                                            ...S.card,
                                            ...(isHighlighted ? S.cardHighlighted : null),
                                        }}
                                    >
                                        <p style={S.project}>{item.projectTitle}</p>
                                        <p style={S.meta}>Course: {item.courseName}</p>
                                        <p style={S.meta}>From: {item.senderName}</p>
                                        <p style={S.meta}>Section: {item.senderSection}</p>
                                        {item.senderSkills && item.senderSkills.length > 0 ? (
                                            <p style={S.meta}>Skills: {item.senderSkills.join(", ")}</p>
                                        ) : null}
                                        {item.message ? <p style={S.message}>{item.message}</p> : null}
                                        <p style={S.date}>{new Date(item.invitedAt).toLocaleString()}</p>
                                        {status === "accepted" ? (
                                            <div style={S.row}>
                                                <span style={S.acceptedBadge}>Joined Team</span>
                                                <button
                                                    type="button"
                                                    style={S.viewTeamBtn}
                                                    onClick={() => {
                                                        const r = acceptResultByInvitationId[item.invitationId];
                                                        const cid = r?.courseId ?? item.courseId;
                                                        const pid = r?.projectId ?? item.projectId;
                                                        navigate(`/student/courses/${cid}/projects/${pid}/team`);
                                                    }}
                                                >
                                                    View My Team
                                                </button>
                                            </div>
                                        ) : status === "rejected" ? (
                                            <div style={S.row}>
                                                <span style={S.rejectedBadge}>Invitation Rejected</span>
                                            </div>
                                        ) : (
                                            <div style={S.row}>
                                                <button type="button" disabled={busy} style={S.acceptBtn} onClick={() => void handleAccept(item.invitationId)}>
                                                    Accept Invitation
                                                </button>
                                                <button type="button" disabled={busy} style={S.rejectBtn} onClick={() => void handleReject(item.invitationId)}>
                                                    Reject Invitation
                                                </button>
                                            </div>
                                        )}
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

const S: Record<string, CSSProperties> = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "24px 28px 40px", fontFamily: "Inter, system-ui, sans-serif" },
    container: { maxWidth: 980, margin: "0 auto" },
    backBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 700 },
    headerCard: { marginTop: 20, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", padding: "20px 22px", boxShadow: "0 8px 22px rgba(15,23,42,0.05)" },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "8px 0 0", fontSize: 14, color: "#6b7280" },
    mainCard: { marginTop: 14, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", padding: 18, boxShadow: "0 8px 22px rgba(15,23,42,0.05)" },
    note: { margin: 0, fontSize: 13, color: "#6b7280" },
    error: { margin: 0, fontSize: 13, color: "#b91c1c", fontWeight: 600 },
    emptyState: { padding: "18px 14px", borderRadius: 12, background: "#f8fafc", border: "1px dashed #d1d5db", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
    emptyTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "#6b7280" },
    list: { display: "flex", flexDirection: "column", gap: 10 },
    card: { border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", padding: "12px 14px", boxShadow: "0 3px 10px rgba(15,23,42,0.04)" },
    cardHighlighted: { borderColor: "#c4b5fd", boxShadow: "0 0 0 3px rgba(124,58,237,0.16)" },
    project: { margin: 0, fontSize: 14, fontWeight: 800, color: "#1f2937" },
    meta: { margin: "6px 0 0", fontSize: 12, color: "#6b7280" },
    message: { margin: "8px 0 0", fontSize: 12, color: "#334155", lineHeight: 1.45 },
    date: { margin: "8px 0 0", fontSize: 11, color: "#94a3b8" },
    row: { marginTop: 10, display: "flex", gap: 8 },
    acceptBtn: { border: "none", borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "8px 12px", cursor: "pointer" },
    rejectBtn: { border: "1px solid #fecaca", borderRadius: 10, background: "#fff1f2", color: "#be123c", fontSize: 12, fontWeight: 700, padding: "8px 12px", cursor: "pointer" },
    acceptedBadge: { display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#166534", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 999, padding: "6px 10px" },
    rejectedBadge: { display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#be123c", background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 999, padding: "6px 10px" },
    viewTeamBtn: { border: "none", borderRadius: 10, background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, padding: "8px 12px", cursor: "pointer" },
};
