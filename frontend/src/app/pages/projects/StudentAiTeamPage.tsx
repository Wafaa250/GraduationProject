import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type SuggestedMate = {
    id: number;
    name: string;
    skills: string[];
    match: number;
};

const INITIAL_SUGGESTIONS: SuggestedMate[] = [
    { id: 1, name: "Ahmad", skills: ["React", "Node"], match: 92 },
    { id: 2, name: "Mohammad", skills: ["UI", "UX"], match: 88 },
];

export default function StudentAiTeamPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const [suggestions, setSuggestions] = useState<SuggestedMate[]>(INITIAL_SUGGESTIONS);

    const title = useMemo(() => `Project #${projectId ?? "—"}`, [projectId]);

    const regenerate = () => {
        setSuggestions((prev) =>
            prev
                .map((mate, idx) => ({
                    ...mate,
                    match: Math.max(75, Math.min(98, mate.match - 2 + idx * 3)),
                }))
                .sort((a, b) => b.match - a.match),
        );
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
                    <p style={P.subtitle}>AI Suggested Team</p>
                </header>

                <section style={P.mainCard}>
                    <div style={P.actionsRow}>
                        <button type="button" style={P.primaryBtn}>
                            Accept This Team
                        </button>
                        <button type="button" style={P.secondaryBtn} onClick={regenerate}>
                            <Sparkles size={14} />
                            Regenerate
                        </button>
                    </div>

                    <div style={P.grid}>
                        {suggestions.map((mate) => (
                            <article key={mate.id} style={P.card}>
                                <div style={P.cardTop}>
                                    <div style={P.avatar}>{mate.name.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <p style={P.name}>{mate.name}</p>
                                    </div>
                                    <span style={P.matchBadge}>{mate.match}%</span>
                                </div>
                                <div style={P.skillsWrap}>
                                    {mate.skills.map((skill) => (
                                        <span key={skill} style={P.skillTag}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        ))}
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
    },
    skillsWrap: {
        marginTop: 10,
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
    },
    skillTag: {
        fontSize: 11,
        fontWeight: 700,
        color: "#475569",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: 999,
        padding: "4px 8px",
    },
};
