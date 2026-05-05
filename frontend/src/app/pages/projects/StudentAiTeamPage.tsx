import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
    acceptTeamInvitation,
    getCourseProjectMyTeam,
    getCourseProjectEligibleStudents,
    getMyTeamInvitations,
    rejectTeamInvitation,
    sendCourseProjectInvitations,
    type CourseTeamEligibleStudent,
    type CourseProjectMyTeamStatus,
    type TeamInvitationItem,
} from "../../../api/studentCoursesApi";

export default function StudentAiTeamPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const projectIdNum = Number(projectId);

    const [showSelection, setShowSelection] = useState(false);
    const [eligibleStudents, setEligibleStudents] = useState<CourseTeamEligibleStudent[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [sending, setSending] = useState(false);
    const [loadingEligible, setLoadingEligible] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sentThisSessionIds, setSentThisSessionIds] = useState<number[]>([]);

    const [invitations, setInvitations] = useState<TeamInvitationItem[]>([]);
    const [loadingInvitations, setLoadingInvitations] = useState(false);
    const [myTeam, setMyTeam] = useState<CourseProjectMyTeamStatus | null>(null);
    const [loadingMyTeam, setLoadingMyTeam] = useState(false);

    const title = useMemo(() => `Project #${projectId ?? "—"}`, [projectId]);
    const outgoingInvitations = myTeam?.invitations ?? [];
    const isTeamComplete = myTeam?.status === "complete";
    const selectedCount = myTeam?.selectedCount ?? 0;
    const requiredCount = myTeam?.teamSize ?? 0;
    const seatsLeft = myTeam?.seatsLeft ?? 0;
    const pendingOutgoingCount = outgoingInvitations.filter((i) => i.status === "pending").length;
    const acceptedOutgoingCount = outgoingInvitations.filter((i) => i.status === "accepted").length;
    const inviteCapacityReached =
        myTeam != null && pendingOutgoingCount + acceptedOutgoingCount >= Math.max(0, myTeam.teamSize - 1);

    const loadMyTeam = async (): Promise<CourseProjectMyTeamStatus | null> => {
        if (!Number.isFinite(projectIdNum) || projectIdNum <= 0) return null;
        setLoadingMyTeam(true);
        try {
            const data = await getCourseProjectMyTeam(projectIdNum);
            setMyTeam(data);
            if (data.status === "complete") setShowSelection(false);
            return data;
        } catch (err) {
            setError(parseApiErrorMessage(err));
            return null;
        } finally {
            setLoadingMyTeam(false);
        }
    };

    const loadInvitations = async () => {
        setLoadingInvitations(true);
        try {
            const data = await getMyTeamInvitations();
            setInvitations(data.filter((i) => i.projectId === projectIdNum));
        } catch (err) {
            setError(parseApiErrorMessage(err));
        } finally {
            setLoadingInvitations(false);
        }
    };

    useEffect(() => {
        if (!Number.isFinite(projectIdNum) || projectIdNum <= 0) return;
        void loadInvitations();
        void loadMyTeam();
    }, [projectIdNum]);

    const openSelection = async () => {
        if (!Number.isFinite(projectIdNum) || projectIdNum <= 0) return;
        setShowSelection(true);
        setLoadingEligible(true);
        setError(null);
        setStatus(null);
        try {
            const students = await getCourseProjectEligibleStudents(projectIdNum);
            setEligibleStudents(students);
            setSelectedIds([]);
        } catch (err) {
            console.error("Eligible students request failed", {
                error: err,
                response: (err as { response?: unknown })?.response,
                data: (err as { response?: { data?: unknown } })?.response?.data,
            });
            setError(parseApiErrorMessage(err));
        } finally {
            setLoadingEligible(false);
        }
    };

    const sendInvitations = async () => {
        if (selectedIds.length === 0 || !Number.isFinite(projectIdNum) || projectIdNum <= 0) return;
        setSending(true);
        setError(null);
        try {
            await sendCourseProjectInvitations(projectIdNum, { receiverIds: selectedIds });
            setSentThisSessionIds((prev) => Array.from(new Set([...prev, ...selectedIds])));
            setSelectedIds([]);
            setStatus("Invitations sent");
            const team = await loadMyTeam();
            if (team?.status !== "complete") {
                await openSelection();
            }
            await loadInvitations();
        } catch (err) {
            setError(parseApiErrorMessage(err));
        } finally {
            setSending(false);
        }
    };

    const toggleStudent = (studentId: number) => {
        setSelectedIds((prev) =>
            prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
        );
    };

    const acceptInvitation = async (id: number) => {
        try {
            await acceptTeamInvitation(id);
            await loadInvitations();
            await loadMyTeam();
            setStatus("Invitation accepted");
        } catch (err) {
            setError(parseApiErrorMessage(err));
        }
    };

    const rejectInvitation = async (id: number) => {
        try {
            await rejectTeamInvitation(id);
            await loadInvitations();
            await loadMyTeam();
            setStatus("Invitation rejected");
        } catch (err) {
            setError(parseApiErrorMessage(err));
        }
    };

    return (
        <div style={P.page}>
            <div style={{ maxWidth: 980, margin: "0 auto" }}>
                <button type="button" onClick={() => navigate(-1)} style={P.backBtn}>
                    <ArrowLeft size={16} />
                    Back
                </button>

                <header style={P.headerCard}>
                    <h1 style={P.title}>{title}</h1>
                    <p style={P.subtitle}>Student Team Selection</p>
                    {isTeamComplete ? (
                        <span style={P.completeBadge}>Team Complete</span>
                    ) : null}
                </header>

                <section style={P.mainCard}>
                    <div style={P.statusPanel}>
                        <p style={P.statusText}>
                            Selected {selectedCount} / Required {requiredCount}
                        </p>
                        <p style={P.statusText}>Seats left: {seatsLeft}</p>
                    </div>
                    <div style={P.actionsRow}>
                        <button
                            type="button"
                            style={{ ...P.primaryBtn, opacity: isTeamComplete ? 0.6 : 1 }}
                            onClick={() => void openSelection()}
                            disabled={isTeamComplete}
                        >
                            Choose Teammates
                        </button>
                        <button type="button" style={P.secondaryBtn} onClick={() => void loadInvitations()}>
                            <Sparkles size={14} />
                            Refresh
                        </button>
                    </div>
                    {status ? <p style={P.okText}>{status}</p> : null}
                    {error ? <p style={P.errorText}>{error}</p> : null}
                    {loadingMyTeam ? <p style={P.subtitle}>Loading team status…</p> : null}
                    {isTeamComplete ? (
                        <p style={P.okText}>Your team has been successfully formed.</p>
                    ) : null}

                    {isTeamComplete && myTeam ? (
                        <div style={{ marginBottom: 14 }}>
                            <p style={P.sectionTitle}>Your Team</p>
                            <div style={P.grid}>
                                {myTeam.members.map((member) => (
                                    <article key={member.studentId} style={P.card}>
                                        <div style={P.cardTop}>
                                            <div style={P.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p style={P.name}>
                                                    {member.name} <span style={P.memberCheck}>✓</span>
                                                </p>
                                                <span style={{ ...P.badge, ...P.badgeAccepted }}>Accepted</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {showSelection && !isTeamComplete ? (
                        <div style={{ marginBottom: 14 }}>
                            <p style={P.sectionTitle}>Choose teammates</p>
                            {loadingEligible ? (
                                <p style={P.subtitle}>Loading students…</p>
                            ) : eligibleStudents.length === 0 ? (
                                <p style={P.subtitle}>No eligible students available.</p>
                            ) : (
                                <div style={P.grid}>
                                    {eligibleStudents.map((student, idx) => {
                                        const disabled =
                                            !student.canInvite ||
                                            sentThisSessionIds.includes(student.studentId) ||
                                            student.alreadyInvited ||
                                            student.alreadyInTeam;
                                        const checked = selectedIds.includes(student.studentId);
                                        const isTopPick = idx === 0;
                                        const isTopThree = idx < 3;
                                        return (
                                            <article
                                                key={student.studentId}
                                                style={{
                                                    ...P.card,
                                                    ...(isTopThree ? P.recommendedCard : {}),
                                                }}
                                            >
                                                <div style={P.cardTop}>
                                                    <div style={P.avatar}>{student.name.charAt(0).toUpperCase()}</div>
                                                    <div>
                                                        <p style={P.name}>{student.name}</p>
                                                        {isTopPick ? <span style={P.recommendedBadge}>⭐ Recommended</span> : null}
                                                        <p style={P.subtitleSmall}>Section {student.sectionId}</p>
                                                        {student.matchReason ? (
                                                            <p style={P.matchReasonText}>{student.matchReason}</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <label style={P.checkboxRow}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onChange={() => toggleStudent(student.studentId)}
                                                    />
                                                    <span>
                                                        {disabled
                                                            ? student.alreadyInTeam
                                                                ? "Already in a team"
                                                                : "Invitation already sent"
                                                            : "Select"}
                                                    </span>
                                                </label>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                            {!isTeamComplete ? (
                                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        type="button"
                                        style={{
                                            ...P.primaryBtn,
                                            opacity:
                                                selectedIds.length === 0 || sending || isTeamComplete || inviteCapacityReached
                                                    ? 0.6
                                                    : 1,
                                        }}
                                        disabled={selectedIds.length === 0 || sending || isTeamComplete || inviteCapacityReached}
                                        onClick={() => void sendInvitations()}
                                    >
                                        {sending ? "Sending..." : "Send Invitations"}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div>
                        <p style={P.sectionTitle}>Invited Students</p>
                        {outgoingInvitations.length === 0 ? (
                            <p style={P.subtitle}>No sent invitations yet.</p>
                        ) : (
                            <div style={P.grid}>
                                {outgoingInvitations.map((inv) => (
                                    <article key={`sent-${inv.id}`} style={P.card}>
                                        <div style={P.cardTop}>
                                            <div style={P.avatar}>{inv.receiverName.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p style={P.name}>{inv.receiverName}</p>
                                                <span
                                                    style={{
                                                        ...P.badge,
                                                        ...(inv.status === "accepted"
                                                            ? P.badgeAccepted
                                                            : inv.status === "rejected"
                                                              ? P.badgeRejected
                                                              : P.badgePending),
                                                    }}
                                                >
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <p style={P.sectionTitle}>Team Invitations</p>
                        {loadingInvitations ? (
                            <p style={P.subtitle}>Loading invitations…</p>
                        ) : invitations.length === 0 ? (
                            <p style={P.subtitle}>No invitations yet.</p>
                        ) : (
                            <div style={P.grid}>
                                {invitations.map((inv) => (
                                    <article key={inv.id} style={P.card}>
                                        <div style={P.cardTop}>
                                            <div style={P.avatar}>{inv.senderName.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p style={P.name}>{inv.senderName}</p>
                                                <p style={P.subtitleSmall}>{inv.projectTitle}</p>
                                            </div>
                                        </div>
                                        <p style={P.subtitleSmall}>Status: {inv.status}</p>
                                        {inv.status === "pending" ? (
                                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                                <button
                                                    type="button"
                                                    style={P.acceptBtn}
                                                    disabled={isTeamComplete}
                                                    onMouseDown={(e) => {
                                                        if (isTeamComplete) e.preventDefault();
                                                    }}
                                                    onClick={() => void acceptInvitation(inv.id)}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    type="button"
                                                    style={P.rejectBtn}
                                                    onClick={() => void rejectInvitation(inv.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

const P: Record<string, CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "24px 28px 40px",
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
        marginTop: 14,
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: "18px 20px",
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "6px 0 0", fontSize: 13, color: "#6b7280", fontWeight: 600 },
    subtitleSmall: { margin: "4px 0 0", fontSize: 12, color: "#6b7280" },
    sectionTitle: { margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#1f2937" },
    completeBadge: {
        display: "inline-flex",
        alignItems: "center",
        width: "fit-content",
        marginTop: 10,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 800,
        color: "#166534",
        background: "#dcfce7",
        border: "1px solid #bbf7d0",
    },
    statusPanel: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
    },
    statusText: { margin: 0, fontSize: 12, fontWeight: 700, color: "#475569" },
    okText: { margin: "6px 0 10px", fontSize: 12, color: "#166534", fontWeight: 700 },
    errorText: { margin: "6px 0 10px", fontSize: 12, color: "#b91c1c", fontWeight: 700 },
    mainCard: {
        marginTop: 14,
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: 16,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    actionsRow: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginBottom: 12,
    },
    primaryBtn: {
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "9px 13px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    secondaryBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid #d1d5db",
        borderRadius: 10,
        background: "#fff",
        color: "#374151",
        fontSize: 12,
        fontWeight: 700,
        padding: "9px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    acceptBtn: {
        border: "none",
        borderRadius: 8,
        background: "#16a34a",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "7px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    rejectBtn: {
        border: "1px solid #fecaca",
        borderRadius: 8,
        background: "#fff1f2",
        color: "#be123c",
        fontSize: 12,
        fontWeight: 700,
        padding: "7px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
        gap: 12,
    },
    card: {
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 12,
        boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
        transition: "transform 0.14s ease, box-shadow 0.14s ease",
    },
    recommendedCard: {
        border: "1px solid #ddd6fe",
        background: "#faf5ff",
    },
    cardTop: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 34,
        height: 34,
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
    recommendedBadge: {
        display: "inline-flex",
        alignItems: "center",
        marginTop: 5,
        borderRadius: 999,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 700,
        color: "#6d28d9",
        background: "#f3e8ff",
        border: "1px solid #e9d5ff",
    },
    matchReasonText: { margin: "6px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.45 },
    memberCheck: { color: "#16a34a", fontWeight: 900 },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "3px 8px",
        marginTop: 5,
        fontSize: 11,
        fontWeight: 700,
        border: "1px solid transparent",
        textTransform: "capitalize",
    },
    badgePending: {
        color: "#92400e",
        background: "#fef3c7",
        borderColor: "#fde68a",
    },
    badgeAccepted: {
        color: "#166534",
        background: "#dcfce7",
        borderColor: "#bbf7d0",
    },
    badgeRejected: {
        color: "#b91c1c",
        background: "#fee2e2",
        borderColor: "#fecaca",
    },
    checkboxRow: {
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 700,
        color: "#475569",
    },
};
