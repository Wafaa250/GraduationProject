import type { CSSProperties } from "react";
import { Briefcase } from "lucide-react";
import type { DoctorSupervisedProject } from "../doctorDashboardTypes";
import { SectionSpinner } from "./SectionSpinner";
import { cardStyle, dash } from "./doctorDashTokens";

type Props = {
  loading: boolean;
  error: string | null;
  projects: DoctorSupervisedProject[];
  removingId: number | null;
  onRemoveSupervision: (project: DoctorSupervisedProject) => void;
};

export function ProjectsSection({ loading, error, projects, removingId, onRemoveSupervision }: Props) {
  return (
    <div className="doctor-dash-section-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...cardStyle, padding: "20px 22px" }}>
        <h2
          style={{
            margin: "0 0 16px",
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
          <Briefcase size={15} color={dash.accent} /> Supervised projects
        </h2>

        {loading ? (
          <SectionSpinner label="Loading projects…" />
        ) : projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 16px" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>
              {error ? "Could not load projects" : "No supervised projects"}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 13,
                color: error ? dash.danger : dash.subtle,
                fontWeight: error ? 600 : 400,
              }}
            >
              {error ?? (
                <>
                  Accept a request or wait for assignments. Data from{" "}
                  <code style={{ fontSize: 11 }}>GET /doctors/me/supervised-projects</code>.
                </>
              )}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {projects.map((project) => (
              <div
                key={project.projectId}
                style={{
                  ...cardStyle,
                  padding: "20px 22px",
                  boxShadow: "none",
                  border: `1px solid ${dash.border}`,
                  background: "#f8fafc",
                }}
                className="doctor-dash-project-card"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: 18,
                        fontWeight: 800,
                        fontFamily: dash.fontDisplay,
                        color: dash.text,
                      }}
                    >
                      {project.name}
                    </p>
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: dash.muted }}>
                      Lead: <strong style={{ color: dash.text }}>{project.owner.name}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: dash.subtle }}>
                      Members {project.memberCount} / {project.partnersCount} ·{" "}
                      {project.isFull ? "Team full" : "Recruiting"}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: project.isFull ? "#dcfce7" : dash.accentSoft,
                        color: project.isFull ? "#166534" : dash.accent,
                      }}
                    >
                      {project.isFull ? "Full" : "Not full"}
                    </span>
                    <button
                      type="button"
                      disabled={removingId != null}
                      onClick={() => onRemoveSupervision(project)}
                      style={removeBtn}
                    >
                      {removingId === project.projectId ? "Removing…" : "Remove supervision"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const removeBtn: CSSProperties = {
  padding: "8px 16px",
  borderRadius: dash.radiusMd,
  border: "1px solid #fecaca",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: dash.font,
  background: dash.surface,
  color: dash.danger,
};
