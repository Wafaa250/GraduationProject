import { Briefcase } from "lucide-react";
import type { DoctorSupervisedProject } from "../../../../api/doctorDashboardApi";
import { SectionSpinner } from "./SectionSpinner";
import { dash, card } from "./doctorDashTokens";

type Props = {
  projects: DoctorSupervisedProject[];
  loading: boolean;
  error: string | null;
  removingProjectId: number | null;
  onCancelSupervision: (project: DoctorSupervisedProject) => void;
};

function formatCreatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

export function ProjectsSection({
  projects,
  loading,
  error,
  removingProjectId,
  onCancelSupervision,
}: Props) {
  return (
    <div>
      <h2
        style={{
          margin: "0 0 18px",
          fontSize: 13,
          fontWeight: 700,
          color: dash.subtle,
          letterSpacing: "0.06em",
        }}
      >
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
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: dash.fontDisplay }}>
            Supervised projects
          </span>
          <span style={{ fontSize: 12, color: dash.muted, marginLeft: "auto" }}>
            {projects.length} active
          </span>
        </div>

        {error ? (
          <div style={{ padding: "16px 20px", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <SectionSpinner label="Loading supervised projects…" />
        ) : projects.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>
              No supervised projects yet
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: dash.subtle }}>
              Accept a supervision request to see projects here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {projects.map((project) => {
              const removing = removingProjectId === project.projectId;
              const statusLabel = project.isFull ? "Team full" : "Recruiting";
              const skills = project.requiredSkills?.length ? project.requiredSkills : [];
              const detailText = (
                project.abstract ??
                project.description ??
                ""
              ).trim();
              return (
                <div
                  key={project.projectId}
                  style={{
                    padding: "20px 24px",
                    borderBottom: `1px solid ${dash.border}`,
                  }}
                  className={
                    removing ? "dd-myproj-row dd-myproj-fade-out" : "dd-myproj-row"
                  }
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
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: dash.muted, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: dash.subtle }}>Description</span> ·{" "}
                        {detailText || "—"}
                      </p>
                      {skills.length > 0 ? (
                        <div style={{ margin: "0 0 12px" }}>
                          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: dash.subtle }}>
                            REQUIRED SKILLS
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {skills.map((sk, i) => (
                              <span
                                key={`${project.projectId}-sk-${i}`}
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
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: "0 0 12px", fontSize: 12, color: dash.subtle }}>Required skills: —</p>
                      )}
                      <p style={{ margin: "0 0 6px", fontSize: 13, color: dash.muted }}>
                        <span style={{ fontWeight: 700, color: dash.subtle }}>Members</span> ·{" "}
                        {project.memberCount}
                        {" · "}
                        <span style={{ fontWeight: 700, color: dash.subtle }}>Partners capacity</span> ·{" "}
                        {project.partnersCount}
                      </p>
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: dash.muted }}>
                        <span style={{ fontWeight: 700, color: dash.subtle }}>Owner</span> ·{" "}
                        {project.owner?.name ?? "—"}
                        {project.owner?.major ? ` · ${project.owner.major}` : ""}
                        {project.owner?.university ? ` · ${project.owner.university}` : ""}
                      </p>
                      <p style={{ margin: "0 0 10px", fontSize: 12, color: dash.subtle }}>
                        <span style={{ fontWeight: 700, color: dash.muted }}>Created</span> ·{" "}
                        {formatCreatedAt(project.createdAt)}
                      </p>
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
                        {statusLabel}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 10,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        disabled={removingProjectId === project.projectId}
                        onClick={() => onCancelSupervision(project)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: "1.5px solid #fecaca",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: removingProjectId === project.projectId ? "wait" : "pointer",
                          fontFamily: "inherit",
                          background: dash.surface,
                          color: dash.danger,
                          opacity: removingProjectId === project.projectId ? 0.85 : 1,
                          minWidth: 168,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        {removing ? (
                          <>
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                border: "2px solid #fecaca",
                                borderTopColor: dash.danger,
                                borderRadius: "50%",
                                animation: "dd-spin 0.7s linear infinite",
                              }}
                            />
                            Removing…
                          </>
                        ) : (
                          "Cancel Supervision"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes dd-spin { to { transform: rotate(360deg); } }
        .dd-myproj-row:last-child { border-bottom: none !important; }
        .dd-myproj-row:hover { background: #fafbfc; }
        .dd-myproj-fade-out {
          opacity: 0;
          transform: translateX(20px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
      `}</style>
    </div>
  );
}
