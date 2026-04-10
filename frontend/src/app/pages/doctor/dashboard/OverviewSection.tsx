import { Link } from "react-router-dom";
import { BarChart3, Briefcase, ClipboardList, Users } from "lucide-react";
import type { DoctorMeResponse } from "../doctorDashboardTypes";
import type { ProjectHighlight, SupervisedStudentRow } from "./doctorDashboardHelpers";
import { SectionSpinner } from "./SectionSpinner";
import { cardStyle, dash } from "./doctorDashTokens";

type Props = {
  me: DoctorMeResponse;
  loading: boolean;
  error: string | null;
  supervisedCount: number;
  highlight: ProjectHighlight | null;
  supervisedStudents: SupervisedStudentRow[];
  pendingRequestsCount: number;
  totalRequestsCount: number;
};

export function OverviewSection({
  me,
  loading,
  error,
  supervisedCount,
  highlight,
  supervisedStudents,
  pendingRequestsCount,
  totalRequestsCount,
}: Props) {
  if (loading) {
    return <SectionSpinner label="Loading overview…" />;
  }

  return (
    <div
      className="doctor-dash-section-fade"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      {error ? (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: dash.radiusLg,
            border: "1px solid #fecaca",
            background: dash.dangerSoft,
            color: dash.danger,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ ...cardStyle, padding: "22px 24px" }}>
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: 22,
            fontWeight: 800,
            fontFamily: dash.fontDisplay,
            letterSpacing: "-0.02em",
          }}
        >
          Welcome back, {me.name}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: dash.muted, fontWeight: 500 }}>
          {me.specialization ? `${me.specialization} · ` : ""}
          <span style={{ color: dash.subtle }}>Doctor workspace</span>
        </p>
      </div>

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
          value={String(pendingRequestsCount)}
          sub="Supervision requests awaiting action"
        />
        <StatCard
          icon={<Briefcase size={18} />}
          label="Requests (total)"
          value={String(totalRequestsCount)}
          sub="GET /doctors/me/requests"
        />
        <StatCard
          icon={<Users size={18} />}
          label="Supervised projects"
          value={String(supervisedCount)}
          sub="GET /doctors/me/supervised-projects"
        />
        <StatCard
          icon={<BarChart3 size={18} />}
          label="Supervision capacity"
          value={me.supervisionCapacity != null ? String(me.supervisionCapacity) : "—"}
          sub="From your profile"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        <div style={{ ...cardStyle, padding: "20px 22px" }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: dash.subtle,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Briefcase size={15} color={dash.accent} /> Project snapshot
          </h2>
          {!highlight ? (
            <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
              No supervised projects yet. Accept a supervision request to see one here.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: dash.fontDisplay }}>
                {highlight.name}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                Role: <strong style={{ color: dash.text }}>{highlight.role}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                Members {highlight.memberCount} / {highlight.maxTeamSize} ·{" "}
                <span style={{ color: highlight.isFull ? "#166534" : dash.accent, fontWeight: 700 }}>
                  {highlight.isFull ? "Full" : "Not full"}
                </span>
              </p>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: "20px 22px" }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: dash.subtle,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Users size={15} color={dash.accent} /> Students you supervise
          </h2>
          {supervisedStudents.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
              No students linked yet — supervised project owners will appear here.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {supervisedStudents.map((s) => (
                <li
                  key={s.userId}
                  style={{
                    padding: "12px 14px",
                    background: "#f8fafc",
                    borderRadius: dash.radiusMd,
                    border: `1px solid ${dash.border}`,
                  }}
                >
                  <Link
                    to={`/students/${s.userId}`}
                    style={{ fontSize: 14, fontWeight: 700, color: dash.accent }}
                  >
                    {s.name}
                  </Link>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: dash.muted }}>
                    {s.major}
                    {s.university ? ` · ${s.university}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "box-shadow 0.2s ease",
      }}
      className="doctor-dash-stat-card"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: dash.accent }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: dash.fontDisplay, color: dash.text }}>{value}</p>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: dash.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 10, color: dash.subtle }}>{sub}</p>
    </div>
  );
}
