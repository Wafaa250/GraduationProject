import { Link } from "react-router-dom";
import { Briefcase, ClipboardList, Hash, Sparkles } from "lucide-react";
import type { DashboardSummary } from "../../../../api/dashboardApi";
import type { DoctorMeResponse } from "../doctorDashboardTypes";
import { SectionSpinner } from "./SectionSpinner";
import { dash, card } from "./doctorDashTokens";
import type { ProjectHighlight, SuggestionRow } from "./doctorDashboardHelpers";

type Props = {
  me: DoctorMeResponse;
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  highlight: ProjectHighlight | null;
  suggestions: SuggestionRow[];
  pendingRequestsCount: number;
};

export function OverviewSection({
  me,
  summary,
  loading,
  error,
  highlight,
  suggestions,
  pendingRequestsCount,
}: Props) {
  const displayName = me.name || summary?.name || "—";

  if (loading && !summary) {
    return (
      <div>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: dash.muted }}>Overview</p>
        <h1 style={{ margin: "0 0 20px", fontSize: 26, fontWeight: 800, fontFamily: dash.fontDisplay }}>
          {displayName}
        </h1>
        <SectionSpinner label="Loading dashboard summary…" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: dash.subtle, letterSpacing: "0.08em" }}>
          OVERVIEW
        </p>
        <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, fontFamily: dash.fontDisplay, color: dash.text }}>
          {displayName}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: dash.muted }}>
          {me.specialization ? `${me.specialization} · ` : null}
          {summary?.university ? summary.university : null}
        </p>
      </div>

      {error && !summary ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: dash.radiusMd,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Pending requests"
          value={loading ? "…" : String(pendingRequestsCount)}
          accent
        />
        <StatCard
          icon={<Briefcase size={18} />}
          label="Profile strength"
          value={loading ? "…" : summary?.profileStrength.score != null ? `${summary.profileStrength.score}` : "—"}
        />
        <StatCard
          icon={<Hash size={18} />}
          label="Skills tracked"
          value={loading ? "…" : summary?.totalSkills != null ? String(summary.totalSkills) : "—"}
        />
        <StatCard
          icon={<Sparkles size={18} />}
          label="Suggestions"
          value={loading ? "…" : summary?.suggestedTeammates?.length != null ? String(summary.suggestedTeammates.length) : "—"}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
            PROJECT SUMMARY
          </h2>
          {loading && !highlight ? (
            <SectionSpinner label="Loading…" />
          ) : !highlight ? (
            <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>No project data from the summary.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: dash.fontDisplay }}>{highlight.name}</p>
              <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                Role: <strong style={{ color: dash.text }}>{highlight.role}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                Team: {highlight.memberCount} / {highlight.maxTeamSize} · {highlight.isFull ? "Full" : "Not full"}
              </p>
            </div>
          )}
        </div>

        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
            SUGGESTED TEAMMATES
          </h2>
          {loading && suggestions.length === 0 ? (
            <SectionSpinner label="Loading suggestions…" />
          ) : suggestions.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>No suggestions in the current summary.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map((s) => (
                <li
                  key={s.userId}
                  style={{
                    ...card,
                    padding: "12px 14px",
                    boxShadow: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                  className="dd-suggest-card"
                >
                  <div style={{ minWidth: 0 }}>
                    <Link
                      to={`/students/${s.userId}`}
                      style={{ fontSize: 14, fontWeight: 700, color: dash.accent, textDecoration: "none" }}
                    >
                      {s.name}
                    </Link>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: dash.muted }}>
                      {s.major}
                      {s.university ? ` · ${s.university}` : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: dash.accentMuted,
                      color: dash.accent,
                      flexShrink: 0,
                    }}
                  >
                    {s.matchScore}% match
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <style>{`
        .dd-suggest-card:hover { box-shadow: ${dash.shadowLg}; }
      `}</style>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        ...card,
        padding: "16px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
      className="dd-stat-card"
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: accent ? dash.accentMuted : "transparent",
          border: accent ? "none" : `1px solid ${dash.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: dash.accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: dash.fontDisplay, color: dash.text }}>{value}</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 600, color: dash.muted }}>{label}</p>
      </div>
    </div>
  );
}
