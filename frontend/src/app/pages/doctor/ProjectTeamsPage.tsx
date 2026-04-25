import type { CSSProperties } from "react";
import { ArrowLeft, RotateCw, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const teams = [
    {
        id: 1,
        name: "Team A",
        members: [
            { name: "Mohammad", role: "Leader" },
            { name: "Ahmad", role: "Member" },
        ],
    },
    {
        id: 2,
        name: "Team B",
        members: [
            { name: "Sara", role: "Leader" },
            { name: "Lina", role: "Member" },
        ],
    },
];

export default function ProjectTeamsPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

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
            <div style={{ maxWidth: 1040, margin: "0 auto" }}>
                <button
                    type="button"
                    onClick={() => navigate("/doctor-dashboard")}
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </button>

                <header style={S.headerCard}>
                    <div style={S.headerRow}>
                        <h1 style={S.title}>Project Teams</h1>
                        <button
                            type="button"
                            style={S.globalRegenerateBtn}
                            onClick={() => {
                                console.log("Regenerating teams...");
                            }}
                        >
                            <RotateCw size={14} />
                            Regenerate All Teams
                        </button>
                    </div>
                    <p style={S.subtitle}>Project #{projectId ?? "—"}</p>
                </header>

                <div style={S.grid}>
                    {teams.map((team) => (
                        <article key={team.id} style={S.card}>
                            <div style={S.cardHead}>
                                <h2 style={S.teamName}>{team.name}</h2>
                                <span style={S.countChip}>
                                    <Users size={12} />
                                    {team.members.length}
                                </span>
                            </div>

                            <div style={S.membersList}>
                                {team.members.map((member) => (
                                    <div key={`${team.id}-${member.name}`} style={S.memberRow}>
                                        <div style={S.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                        <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center" }}>
                                            <p style={S.memberName}>{member.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={S.actions}>
                                <button
                                    type="button"
                                    style={S.secondaryBtn}
                                    onClick={() =>
                                        navigate(`/doctor/projects/${projectId ?? "0"}/teams/${team.id}`)
                                    }
                                >
                                    Manage Team
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
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
    headerRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
    },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "6px 0 0", fontSize: 13, color: "#64748b" },
    globalRegenerateBtn: {
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "9px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
    },
    grid: {
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
        gap: 14,
    },
    card: {
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        background: "#fff",
        padding: 14,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    cardHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    teamName: { margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" },
    countChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        color: "#6d28d9",
        background: "#f3e8ff",
        border: "1px solid #e9d5ff",
        borderRadius: 999,
        padding: "4px 8px",
    },
    membersList: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    memberRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#f8fafc",
        padding: "8px 10px",
    },
    avatar: {
        width: 30,
        height: 30,
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
    memberName: { margin: 0, fontSize: 13, fontWeight: 600, color: "#1f2937" },
    actions: {
        marginTop: 8,
        display: "flex",
        justifyContent: "flex-end",
    },
    secondaryBtn: {
        border: "1px solid #d1d5db",
        borderRadius: 9,
        background: "#fff",
        color: "#334155",
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 11px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
};
