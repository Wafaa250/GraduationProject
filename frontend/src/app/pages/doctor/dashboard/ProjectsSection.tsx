import { Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DoctorSupervisedProject } from "../doctorDashboardTypes";
import { SectionSpinner } from "./SectionSpinner";
import { dash, card } from "./doctorDashTokens";

type Props = {
  /** GET /api/doctors/me/supervised-projects */
  projects: DoctorSupervisedProject[];
  loading: boolean;
  error: string | null;
  removingId: number | null;
  onRemoveSupervision: (project: DoctorSupervisedProject) => void;
};

export function ProjectsSection({
  projects,
  loading,
  error,
  removingId,
  onRemoveSupervision,
}: Props) {
  const navigate = useNavigate();

  return (
    <div>
      <h2 style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
        MY PROJECTS
      </h2>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${dash.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Briefcase size={18} color={dash.accent} />
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: dash.fontDisplay }}>Supervised projects</span>
          <span style={{ fontSize: 12, color: dash.muted, marginLeft: "auto" }}>{projects.length} total</span>
        </div>

        {error ? (
          <div style={{ padding: "16px 20px", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>{error}</div>
        ) : null}

        {loading ? (
          <SectionSpinner label="Loading projects…" />
        ) : projects.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>No supervised projects</p>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: dash.subtle }}>
              Projects you supervise will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {projects.map((project) => (
              <div
                key={project.projectId}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/doctor/projects/${project.projectId}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/doctor/projects/${project.projectId}`);
                  }
                }}
                style={{
                  padding: "20px 24px",
                  borderBottom: `1px solid ${dash.border}`,
                  cursor: "pointer",
                }}
                className="dd-proj-row"
                aria-label={`Open project ${project.name}`}
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
                  <div style={{ minWidth: 0, flex: "1 1 280px" }}>
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: 18,
                        fontWeight: 800,
                        fontFamily: dash.fontDisplay,
                        color: dash.text,
                      }}
                    >
                      {project.name}
                    </p>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: dash.muted, lineHeight: 1.5 }}>
                      {project.description?.trim() ? project.description : "—"}
                    </p>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.04em" }}>
                      Required skills
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {project.requiredSkills?.length ? (
                        project.requiredSkills.map((skill, i) => (
                          <span
                            key={`${project.projectId}-skill-${i}`}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: 8,
                              background: dash.bg,
                              color: dash.muted,
                              border: `1px solid ${dash.border}`,
                            }}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: dash.subtle }}>—</span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.04em" }}>
                      Owner
                    </p>
                    <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: dash.text }}>
                      {project.owner?.name?.trim() || "—"}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: dash.muted }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.04em" }}>
                        Members / partners
                      </span>
                      <br />
                      <span style={{ fontSize: 15, fontWeight: 700, color: dash.text }}>
                        {project.memberCount} / {project.partnersCount}
                      </span>
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 20,
                        background: project.isFull ? "#dcfce7" : dash.accentMuted,
                        color: project.isFull ? "#166534" : dash.accent,
                      }}
                    >
                      {project.isFull ? "Team full" : "Recruiting"}
                    </span>
                    <button
                      type="button"
                      disabled={removingId != null}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSupervision(project);
                      }}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "1.5px solid #fecaca",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: removingId != null ? "wait" : "pointer",
                        fontFamily: "inherit",
                        background: dash.surface,
                        color: dash.danger,
                      }}
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
      <style>{`
        .dd-proj-row:last-child { border-bottom: none !important; }
        .dd-proj-row:hover { background: #fafbfc; }
      `}</style>
    </div>
  );
}
