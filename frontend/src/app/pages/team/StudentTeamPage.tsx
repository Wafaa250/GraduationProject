import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type TeamMember = {
    studentId: number;
    userId: number;
    name: string;
    universityId: string;
    matchScore: number;
};

type MyTeamResponse = {
    projectId: number;
    projectTitle: string;
    courseId: number;
    teamId: number;
    teamIndex: number;
    members: TeamMember[];
};

type ChatMessage = {
    id: number;
    teamId: number;
    senderUserId: number;
    senderName: string;
    text: string;
    sentAt: string;
};

const TEAM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ── Component ──────────────────────────────────────────────────────────────────

export default function StudentTeamPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const { showToast } = useToast();

    // ── Team state ─────────────────────────────────────────────────────────────
    const [team, setTeam] = useState<MyTeamResponse | null>(null);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [meData, setMeData] = useState<unknown>(null);

    // ── Chat state ─────────────────────────────────────────────────────────────
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentUserId = useMemo(() => {
        const raw = (meData as { id?: unknown; Id?: unknown } | null)?.id ??
            (meData as { id?: unknown; Id?: unknown } | null)?.Id;
        return typeof raw === "number" ? raw : null;
    }, [meData]);

    // ── Load team ──────────────────────────────────────────────────────────────
    const loadTeam = useCallback(async () => {
        if (!projectId) return;
        try {
            const [teamRes, meRes] = await Promise.all([
                api.get<MyTeamResponse>(`/courses/projects/${projectId}/my-team`),
                api.get("/me"),
            ]);
            setTeam(teamRes.data);
            setMeData(meRes.data);
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setLoadingTeam(false);
        }
    }, [projectId, showToast]);

    useEffect(() => {
        void loadTeam();
    }, [loadTeam]);

    // ── Load chat messages ─────────────────────────────────────────────────────
    const loadMessages = useCallback(async (teamId: number) => {
        try {
            const res = await api.get<ChatMessage[]>(`/teams/${teamId}/chat?limit=100`);
            setMessages(res.data);
        } catch {
            // silent
        }
    }, []);

    // Start polling when we have the teamId
    useEffect(() => {
        if (!team?.teamId) return;
        void loadMessages(team.teamId);

        pollRef.current = setInterval(() => {
            void loadMessages(team.teamId);
        }, 4000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [team?.teamId, loadMessages]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Send message ───────────────────────────────────────────────────────────
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || !team?.teamId) return;
        setSending(true);
        try {
            const res = await api.post<ChatMessage>(`/teams/${team.teamId}/chat`, { text });
            setMessages((prev) => [...prev, res.data]);
            setInput("");
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setSending(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    if (loadingTeam) {
        return (
            <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "#64748b", fontSize: 14 }}>Loading team…</p>
            </div>
        );
    }

    if (!team) {
        return (
            <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#64748b", fontSize: 14, marginBottom: 12 }}>
                        You have not been assigned to a team for this project yet.
                    </p>
                    <button type="button" style={S.backBtn} onClick={() => navigate("/student/courses")}>
                        <ArrowLeft size={15} /> Back to courses
                    </button>
                </div>
            </div>
        );
    }

    const teamLabel = `Team ${TEAM_LETTERS[team.teamIndex] ?? team.teamIndex}`;

    return (
        <div style={S.page}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>

                <button type="button" onClick={() => navigate("/student/courses")} style={S.backBtn}>
                    <ArrowLeft size={16} />
                    Back to courses
                </button>

                {/* Header */}
                <section style={S.headerCard}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{team.projectTitle}</h1>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                            {teamLabel} · Team workspace
                        </p>
                    </div>
                </section>

                {/* Main area */}
                <section style={S.mainCard}>
                    <div style={S.layout}>

                        {/* Members sidebar */}
                        <aside style={S.membersCard}>
                            <p style={S.membersTitle}>
                                <Users size={14} />
                                Team Members
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
<<<<<<< HEAD
                                {members.map((member) => (
                                    <div key={member.id} style={S.memberRow}>
                                        <div style={S.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <p style={S.memberName}>
                                                <ProfileLink userId={member.id} role="student">{member.name}</ProfileLink>
                                            </p>
                                            <p style={S.memberRole}>{member.role}</p>
=======
                                {team.members.map((member) => (
                                    <div key={member.studentId} style={S.memberRow}>
                                        <div style={S.avatar}>
                                            {member.name.charAt(0).toUpperCase()}
>>>>>>> 17e238352825efea3aed158919089d2bb60608e9
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={S.memberName}>{member.name}</p>
                                            {member.universityId && (
                                                <p style={S.memberSub}>ID: {member.universityId}</p>
                                            )}
                                        </div>
                                        {member.matchScore > 0 && (
                                            <span style={S.scoreBadge}>
                                                {member.matchScore.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* Chat */}
                        <div style={S.chatCard}>
                            {!team.teamId ? (
                                <div style={S.noChatWrap}>
                                    <p style={{ color: "#64748b", fontSize: 13 }}>
                                        Chat unavailable.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div style={S.messagesWrap}>
                                        {messages.length === 0 && (
                                            <p style={{ color: "#94a3b8", fontSize: 13, alignSelf: "center", margin: "auto" }}>
                                                No messages yet. Say hello!
                                            </p>
                                        )}
                                        {messages.map((msg) => {
                                            const isMe = msg.senderUserId === currentUserId;
                                            return (
                                                <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                                                    {!isMe && (
                                                        <p style={S.senderLabel}>{msg.senderName}</p>
                                                    )}
                                                    <div style={{
                                                        ...S.bubble,
                                                        background: isMe ? "#7c3aed" : "#e5e7eb",
                                                        color: isMe ? "#fff" : "#1f2937",
                                                        borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                                    }}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div style={S.inputRow}>
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    void sendMessage();
                                                }
                                            }}
                                            placeholder="Type a message…"
                                            style={S.input}
                                            disabled={sending}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void sendMessage()}
                                            style={{ ...S.sendBtn, opacity: sending ? 0.6 : 1 }}
                                            disabled={sending}
                                        >
                                            <Send size={15} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                </section>

            </div>
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
    mainCard: {
        marginTop: 14, border: "1px solid #e2e8f0", borderRadius: 14,
        background: "#fff", padding: 14, boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    layout: {
        display: "grid",
        gridTemplateColumns: "260px minmax(0,1fr)",
        gap: 14,
        minHeight: 400,
    },
    membersCard: {
        border: "1px solid #e2e8f0", borderRadius: 12,
        background: "#f8fafc", padding: 12,
    },
    membersTitle: {
        margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6,
        fontSize: 13, fontWeight: 800, color: "#334155",
    },
    memberRow: {
        display: "flex", alignItems: "center", gap: 10,
        border: "1px solid #e2e8f0", borderRadius: 10,
        background: "#fff", padding: "8px 10px",
    },
    avatar: {
        width: 32, height: 32, borderRadius: "50%",
        background: "#ddd6fe", color: "#6d28d9",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, flexShrink: 0,
    },
    memberName: { margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" },
    memberSub: { margin: "2px 0 0", fontSize: 11, color: "#94a3b8" },
    scoreBadge: {
        marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "#6d28d9",
        background: "#f3e8ff", border: "1px solid #e9d5ff",
        borderRadius: 999, padding: "2px 7px", flexShrink: 0,
    },
    chatCard: {
        border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff",
        display: "flex", flexDirection: "column",
    },
    noChatWrap: {
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    },
    messagesWrap: {
        flex: 1, overflowY: "auto", display: "flex",
        flexDirection: "column", gap: 10, padding: "14px 14px 8px",
        minHeight: 300,
    } as CSSProperties,
    senderLabel: {
        margin: "0 0 3px 6px", fontSize: 11, fontWeight: 600, color: "#64748b",
    },
    bubble: {
        borderRadius: 14, padding: "8px 12px", fontSize: 13, lineHeight: 1.45,
        wordBreak: "break-word",
    },
    inputRow: {
        borderTop: "1px solid #e2e8f0", padding: "10px 12px",
        display: "flex", alignItems: "center", gap: 8,
    },
    input: {
        flex: 1, border: "1px solid #d1d5db", borderRadius: 999,
        padding: "9px 14px", fontSize: 13, fontFamily: "inherit",
        outline: "none",
    },
    sendBtn: {
        width: 36, height: 36, borderRadius: "50%", border: "none",
        background: "#7c3aed", color: "#fff", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
};
