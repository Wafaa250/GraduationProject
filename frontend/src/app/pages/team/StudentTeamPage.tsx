import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type TeamMember = {
    id: number;
    name: string;
    role: string;
};

type TeamMessage = {
    id: number;
    sender: string;
    text: string;
};

export default function StudentTeamPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    const members: TeamMember[] = [
        { id: 1, name: "Mohammad", role: "Leader" },
        { id: 2, name: "Ahmad", role: "Member" },
    ];

    const [messages, setMessages] = useState<TeamMessage[]>([
        { id: 1, sender: "Mohammad", text: "Hello team!" },
    ]);
    const [input, setInput] = useState("");

    const title = useMemo(() => {
        return projectId ? `Project #${projectId}` : "Team";
    }, [projectId]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;
        setMessages((prev) => [...prev, { id: Date.now(), sender: "You", text }]);
        setInput("");
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                color: "#0f172a",
                fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
                padding: "24px 28px 40px",
            }}
        >
            <div style={{ maxWidth: 980, margin: "0 auto" }}>
                <button
                    type="button"
                    onClick={() => navigate("/student/courses")}
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back to courses
                </button>

                <section style={S.headerCard}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h1>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
                        Team workspace
                    </p>
                </section>

                <section style={S.mainCard}>
                    <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 14 }}>
                        <aside style={S.membersCard}>
                            <p style={S.membersTitle}>
                                <Users size={14} />
                                Team Members
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {members.map((member) => (
                                    <div key={member.id} style={S.memberRow}>
                                        <div style={S.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <p style={S.memberName}>{member.name}</p>
                                            <p style={S.memberRole}>{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        <div style={S.chatCard}>
                            <div style={S.messagesWrap}>
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        style={{
                                            ...S.messageBubble,
                                            alignSelf: message.sender === "You" ? "flex-end" : "flex-start",
                                            background: message.sender === "You" ? "#7c3aed" : "#e5e7eb",
                                            color: message.sender === "You" ? "#fff" : "#1f2937",
                                        }}
                                    >
                                        {message.text}
                                    </div>
                                ))}
                            </div>
                            <div style={S.inputRow}>
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    style={S.input}
                                />
                                <button type="button" onClick={sendMessage} style={S.sendBtn}>
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

const S: Record<string, CSSProperties> = {
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
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        background: "#fff",
        padding: 18,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    mainCard: {
        marginTop: 14,
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        background: "#fff",
        padding: 14,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    membersCard: {
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#f8fafc",
        padding: 12,
    },
    membersTitle: {
        margin: "0 0 10px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 800,
        color: "#334155",
    },
    memberRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#fff",
        padding: "8px 10px",
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#ddd6fe",
        color: "#6d28d9",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 800,
        flexShrink: 0,
    },
    memberName: { margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" },
    memberRole: { margin: "2px 0 0", fontSize: 11, color: "#64748b" },
    chatCard: {
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        minHeight: 340,
    },
    messagesWrap: {
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
    },
    messageBubble: {
        borderRadius: 12,
        padding: "7px 10px",
        fontSize: 13,
        maxWidth: "75%",
    },
    inputRow: {
        borderTop: "1px solid #e2e8f0",
        padding: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    input: {
        flex: 1,
        border: "1px solid #d1d5db",
        borderRadius: 999,
        padding: "9px 12px",
        fontSize: 13,
        fontFamily: "inherit",
    },
    sendBtn: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: "none",
        background: "#7c3aed",
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
};
