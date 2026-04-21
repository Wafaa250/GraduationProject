import { useMemo, type CSSProperties } from "react";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";

type TeamsLocationState = {
  projectName?: string;
};

const fakeTeams = [
  { id: "1", members: ["Ahmad", "Sara", "Omar"] },
  { id: "2", members: ["Lina", "Khaled", "Noor"] },
];

export default function ProjectTeamsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams<{ courseId: string; projectId: string }>();

  const projectName = useMemo(() => {
    const st = location.state as TeamsLocationState | null;
    const n = st?.projectName?.trim();
    return n && n.length > 0 ? n : "Project";
  }, [location.state]);

  const backHref = courseId ? `/courses/${courseId}` : "/doctor-dashboard";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dash.bg,
        fontFamily: dash.font,
        color: dash.text,
        padding: "24px 28px 40px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <button type="button" onClick={() => navigate(backHref)} style={S.backBtn}>
          <ArrowLeft size={18} />
          Back to course
        </button>

        <header style={{ ...card, padding: "22px 24px", marginTop: 20 }}>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 11,
              fontWeight: 700,
              color: dash.subtle,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Preview
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              fontFamily: dash.fontDisplay,
              lineHeight: 1.25,
            }}
          >
            AI Generated Teams
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, fontWeight: 600, color: dash.muted, lineHeight: 1.45 }}>
            {projectName}
          </p>
        </header>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button type="button" style={S.secondaryBtn}>
            <RefreshCw size={16} />
            Regenerate teams
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {fakeTeams.map((team, index) => (
            <article
              key={team.id}
              style={{
                ...card,
                padding: "20px 18px 18px",
                boxShadow: dash.shadow,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: dash.fontDisplay,
                    color: dash.text,
                    lineHeight: 1.25,
                  }}
                >
                  Team {index + 1}
                </h2>
                <span
                  style={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "5px 9px",
                    borderRadius: 8,
                    background: dash.accentMuted,
                    color: dash.accent,
                    border: "1px solid #c7d2fe",
                  }}
                >
                  <Users size={13} />
                  {team.members.length}
                </span>
              </div>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
                  MEMBERS
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 14, color: dash.text, lineHeight: 1.55 }}>
                  {team.members.map((m) => (
                    <li key={`${team.id}-${m}`}>{m}</li>
                  ))}
                </ul>
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
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  },
};
