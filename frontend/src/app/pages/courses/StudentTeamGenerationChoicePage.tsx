import React, { type CSSProperties } from "react";
import { ArrowLeft, Sparkles, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function StudentTeamGenerationChoicePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { courseId, projectId } = useParams<{ courseId?: string; projectId?: string }>();

    const safeCourseId = courseId ?? "";
    const safeProjectId = projectId ?? "";
    const state = location.state as { projectTitle?: string } | null;
    const projectTitle = state?.projectTitle?.trim() || `Project #${safeProjectId}`;

    return (
        <div style={S.page}>
            <div style={S.container}>
                <button
                    type="button"
                    onClick={() => navigate(`/student/courses/${safeCourseId}?tab=projects`)}
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back to projects
                </button>

                <div style={S.mainCard}>
                    <p style={S.projectLabel}>{projectTitle}</p>
                    <h1 style={S.title}>Choose Team Formation</h1>
                    <p style={S.subtitle}>Choose how you want to form your team</p>

                    <div style={S.optionsGrid}>
                        <article style={S.optionCard}>
                            <div style={S.optionIconWrap}>
                                <Users size={20} />
                            </div>
                            <h2 style={S.optionTitle}>Build My Own Team</h2>
                            <p style={S.optionDescription}>
                                Choose teammates manually from available students.
                            </p>
                            <button
                                type="button"
                                style={S.optionBtn}
                                onClick={() =>
                                    navigate(
                                        `/student/courses/${safeCourseId}/projects/${safeProjectId}/manual-team`,
                                        { state: { projectTitle } },
                                    )
                                }
                            >
                                Continue
                            </button>
                        </article>

                        <article style={S.optionCard}>
                            <div style={S.optionIconWrap}>
                                <Sparkles size={20} />
                            </div>
                            <h2 style={S.optionTitle}>Let AI Suggest Teammates</h2>
                            <p style={S.optionDescription}>
                                Use AI recommendations to build the best matching team.
                            </p>
                            <button
                                type="button"
                                style={S.optionBtn}
                                onClick={() =>
                                    navigate(`/student/courses/${safeCourseId}/projects/${safeProjectId}/ai-team`, {
                                        state: { projectTitle },
                                    })
                                }
                            >
                                Continue
                            </button>
                        </article>
                    </div>
                </div>
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
    container: {
        maxWidth: 980,
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
    mainCard: {
        marginTop: 20,
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: "26px 24px",
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },
    projectLabel: {
        margin: 0,
        fontSize: 12,
        color: "#6b7280",
        fontWeight: 700,
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 800,
        color: "#1f2937",
    },
    subtitle: {
        margin: 0,
        fontSize: 14,
        color: "#6b7280",
    },
    optionsGrid: {
        marginTop: 8,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
    },
    optionCard: {
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fff",
        padding: "18px 16px",
        boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 220,
    },
    optionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ede9fe",
        color: "#6d28d9",
    },
    optionTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 800,
        color: "#1f2937",
    },
    optionDescription: {
        margin: 0,
        fontSize: 13,
        color: "#6b7280",
        lineHeight: 1.5,
        flex: 1,
    },
    optionBtn: {
        marginTop: 6,
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        padding: "10px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: "0 4px 14px rgba(124,58,237,0.28)",
    },
};
